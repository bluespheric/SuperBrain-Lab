export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const json = (data, status = 200) =>
      Response.json(data, {
        status,
        headers: corsHeaders,
      });

    const safeErrorText = (err) => {
      if (!err) return "Unknown error";
      if (typeof err === "string") return err;
      if (err.message) return err.message;
      if (err.description) return err.description;

      try {
        return JSON.stringify(err);
      } catch {
        return "Unknown error";
      }
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        message: "SuperBrain AI Worker is running.",
      });
    }

    if (request.method !== "POST") {
      return json(
        {
          success: false,
          error: "Method not allowed.",
        },
        405
      );
    }

    try {
      const body = await request.json();
      const action = body.action || "image";

      // --------------------------------------------------
      // 1) HİKÂYEDEN 2 SADIK GÖRSEL SAHNE ÜRET
      // --------------------------------------------------
      if (action === "scenes") {
        const text =
          typeof body.text === "string"
            ? body.text.trim()
            : "";

        const lang =
          body.lang === "en"
            ? "en"
            : "tr";

        if (!text) {
          return json(
            {
              success: false,
              error: "Text is required.",
            },
            400
          );
        }

        const captionRule =
          lang === "en"
            ? "Write each caption in English."
            : "Write each caption in Turkish.";

        const systemPrompt = `
You are a storyboard director for an educational dual-coding tool for children.

Your highest priority is VISUAL FIDELITY to the source story, not creativity.

Create exactly 2 visually distinct scenes that together represent the most important events in the story.

STRICT RULES:

1. Use ONLY characters, animals, objects, places and events that are actually present in the source text.

2. Never invent humans, animals, fantasy creatures, vehicles or props that are not in the source.

3. If the source contains no humans, explicitly include "no humans" in every image_prompt.

4. Keep recurring characters visually consistent across both scenes.
Repeat their species, approximate size, fur or hair color, clothing if any, and distinctive traits in EACH image_prompt.

5. Do not rely on character names alone.
Translate names into visible descriptions.
Example:
Instead of only "Tonton", say:
"a small cute white rabbit with soft white fur".

6. Choose concrete, drawable actions.
Show who is doing what, where, and with which important objects.

7. The two scenes should not be generic summaries.
They should depict two specific story moments.

8. image_prompt MUST ALWAYS be written in clear ENGLISH,
even when the story is Turkish.

9. Each image_prompt should be self-contained and around 60-120 words.

10. ${captionRule}

11. Absolutely no text should appear inside the generated image:
no words,
no letters,
no titles,
no captions,
no signs,
no labels,
no speech bubbles,
no numbers,
no logos,
no watermarks.

12. Do not request:
a poster,
book cover,
page,
infographic,
comic panel,
title card,
typography.

13. Prefer one coherent children's storybook scene with a clear foreground, background and action.

14. Preserve important quantities and objects from the story when visually relevant,
such as a basket full of carrots, nuts, berries, books, tools, or other story-specific items.

Return exactly this JSON structure:

{
  "scenes": [
    {
      "caption": "short child-friendly caption",
      "image_prompt": "detailed English visual prompt"
    },
    {
      "caption": "short child-friendly caption",
      "image_prompt": "detailed English visual prompt"
    }
  ]
}
        `.trim();

        const userPrompt =
          `SOURCE STORY:\n${text}\n\n` +
          `Build two faithful visual scenes from this exact story.`;

        let response;

        try {
          response = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fast",
            {
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
                {
                  role: "user",
                  content: userPrompt,
                },
              ],

              temperature: 0.15,

              max_tokens: 900,

              response_format: {
                type: "json_schema",

                json_schema: {
                  type: "object",

                  properties: {
                    scenes: {
                      type: "array",

                      minItems: 2,
                      maxItems: 2,

                      items: {
                        type: "object",

                        properties: {
                          caption: {
                            type: "string",
                          },

                          image_prompt: {
                            type: "string",
                          },
                        },

                        required: [
                          "caption",
                          "image_prompt",
                        ],
                      },
                    },
                  },

                  required: [
                    "scenes",
                  ],
                },
              },
            }
          );

        } catch (aiError) {
          return json(
            {
              success: false,
              where: "scene_generation",
              error: safeErrorText(aiError),
            },
            500
          );
        }

        let sceneData =
          response?.response;

        if (typeof sceneData === "string") {
          const clean = sceneData
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

          const start =
            clean.indexOf("{");

          const end =
            clean.lastIndexOf("}");

          sceneData = JSON.parse(
            start !== -1 && end !== -1
              ? clean.slice(start, end + 1)
              : clean
          );
        }

        if (
          !sceneData ||
          !Array.isArray(sceneData.scenes) ||
          sceneData.scenes.length !== 2
        ) {
          return json(
            {
              success: false,
              where: "scene_generation",
              error:
                "The text model did not return exactly two scenes.",
            },
            500
          );
        }

        const scenes =
          sceneData.scenes.map((scene) => {
            const caption =
              String(scene.caption || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 140);

            const imagePrompt =
              String(scene.image_prompt || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 1500);

            return {
              caption,
              image_prompt: imagePrompt,
            };
          });

        return json({
          success: true,
          scenes,
        });
      }

      // --------------------------------------------------
      // 2) SAHNE PROMPTUNDAN GÖRSEL ÜRET
      // --------------------------------------------------
      if (action === "image") {
        const prompt =
          typeof body.prompt === "string"
            ? body.prompt.trim()
            : "";

        if (!prompt) {
          return json(
            {
              success: false,
              error: "Prompt is required.",
            },
            400
          );
        }

        const compactPrompt =
          prompt
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1450);

        const finalPrompt = (
          `Faithful children's storybook illustration of this exact scene. ` +

          `Show only the characters, animals, objects and setting described below. ` +

          `Do not substitute different species or add unrelated people, animals or objects. ` +

          `Keep the main characters large, recognizable and central to the action. ` +

          `Warm polished 2D storybook art, natural proportions, clear composition, expressive but not exaggerated faces. ` +

          `Clean illustration only. ` +

          `Absolutely ZERO visible typography: ` +
          `no text, no words, no letters, no numbers, no title, no caption, ` +
          `no signs, no labels, no speech bubbles, no logo, no watermark, ` +
          `no book-cover layout, no poster layout. ` +

          `SCENE: ${compactPrompt}`
        ).slice(0, 1950);

        let result;

        try {
          result = await env.AI.run(
            "@cf/black-forest-labs/flux-1-schnell",
            {
              prompt: finalPrompt,
              steps: 4,
            }
          );

        } catch (aiError) {
          return json(
            {
              success: false,
              where: "image_generation",
              error: safeErrorText(aiError),
            },
            500
          );
        }

        if (
          !result ||
          !result.image
        ) {
          return json(
            {
              success: false,
              where: "image_generation",
              error:
                "No image returned from model.",
            },
            500
          );
        }

        const dataUrl =
          `data:image/jpeg;charset=utf-8;base64,${result.image}`;

        return json({
          success: true,
          image: dataUrl,
        });
      }

      return json(
        {
          success: false,
          error: "Unknown action.",
        },
        400
      );

    } catch (error) {
      return json(
        {
          success: false,
          error: safeErrorText(error),
        },
        500
      );
    }
  },
};
