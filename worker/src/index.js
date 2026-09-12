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

      // ==================================================
      // 1) HERHANGİ BİR METNİ ANALİZ ET VE 2 GÖRSEL PLANLA
      // ==================================================

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

        const captionLanguage =
          lang === "en"
            ? "English"
            : "Turkish";

        const systemPrompt = `
You are the visual-planning engine of a general educational dual-coding tool.

The source may be ANY kind of text:

- story
- science
- history
- biography
- instructions
- process
- explanation
- cause-effect text
- comparison
- description
- poem
- abstract concept
- mixed educational text

Your job is NOT to make two generic pretty pictures.

Your job is to choose TWO visuals that help a learner understand and remember the exact source text.

STEP 1 — CLASSIFY THE TEXT

Choose one text_type:

"narrative"
"informational"
"process"
"cause_effect"
"historical"
"comparison"
"descriptive"
"abstract"
"mixed"

STEP 2 — CHOOSE THE TWO MOST USEFUL VISUALS

Use these rules:

NARRATIVE:
Show two specific important events.
Prefer a cause or turning point and then a consequence or resolution.

INFORMATIONAL OR SCIENCE:
Show the central concept first.
Then show its mechanism, relationship, effect, or important example.

PROCESS OR INSTRUCTIONS:
Show two important stages in chronological order.

CAUSE-EFFECT:
Scene 1 should clearly show the cause.
Scene 2 should clearly show the effect.

HISTORICAL OR BIOGRAPHICAL:
Show a source-grounded important event.
Then show another important event, consequence, or context.

COMPARISON:
Make the two scenes clearly represent the two sides being compared.

DESCRIPTIVE:
Show two representative source-grounded aspects.

ABSTRACT:
First try to find literal imagery already present in the source.
If the idea cannot be visualized literally, use a simple educational metaphor
and set scene_mode to "symbolic".

MIXED:
Choose the two visuals that preserve the greatest learning value.

STRICT SOURCE FIDELITY

1. For literal scenes, use only concrete people, animals, objects, places,
actions, quantities, relationships, and time-period details supported
by the source text.

2. Do NOT invent random people, animals, fantasy creatures, buildings,
vehicles, foods, objects, scenery, or events simply to make the image prettier.

3. If the source explicitly identifies something, preserve it.
Examples:
A squirrel must not become a rabbit.
A microscope must not become a telescope.
A ship must not become a car.

4. Do not rely on names alone.

Turn important named entities into visible descriptions.

For example, if the text says:
"Tonton is a small white rabbit"

do not only write:
"Tonton"

write:
"a small white rabbit with soft white fur"

5. Preserve objects, actions, quantities, relationships and settings
that carry the meaning of the source.

6. If a person, character, object, place or other entity appears in both scenes,
repeat its important visual characteristics in both prompts.

7. Do NOT assume that the text contains animals or characters.
Analyze what is actually present.

8. Do NOT automatically add children or human characters to educational scenes.

9. If the source is abstract and a metaphor is necessary,
keep the metaphor simple and clearly symbolic.
Do not present a symbolic invention as if it literally happened in the source.

VISUAL PROMPT RULES

10. image_prompt MUST ALWAYS be written in clear ENGLISH,
even when the source text is Turkish.

11. caption MUST be written in ${captionLanguage}.

12. Every scene must contain a short scene_goal.
This describes what the learner should understand or remember from the image.

13. Every scene must contain a must_include list.
Include 2 to 8 concrete visual requirements.

14. Every scene must contain a must_avoid list.
Include 2 to 8 things that would make the scene inaccurate,
misleading, or irrelevant.

15. image_prompt must be concrete and visually drawable.

Bad:
"Show friendship."

Better:
"Two friends share food with each other while smiling."

16. Never request visible text inside the generated image.

NO:
words
letters
numbers
titles
captions
signs
labels
speech bubbles
logos
watermarks

17. Do NOT request:

poster
book cover
infographic
worksheet
title card
page layout
labeled diagram

18. Choose clarity over decoration.

The important educational elements must be large,
recognizable and central to the composition.

Return EXACTLY this JSON structure:

{
  "text_type": "one allowed type",
  "scenes": [
    {
      "caption": "short learner-friendly caption",
      "scene_mode": "literal or symbolic",
      "scene_goal": "what this visual should teach or remind",
      "must_include": [
        "important visual element",
        "important visual element"
      ],
      "must_avoid": [
        "misleading element",
        "irrelevant element"
      ],
      "image_prompt": "clear English visual description"
    },
    {
      "caption": "short learner-friendly caption",
      "scene_mode": "literal or symbolic",
      "scene_goal": "what this visual should teach or remind",
      "must_include": [
        "important visual element",
        "important visual element"
      ],
      "must_avoid": [
        "misleading element",
        "irrelevant element"
      ],
      "image_prompt": "clear English visual description"
    }
  ]
}
        `.trim();

        const userPrompt =
          `SOURCE TEXT:\n${text}\n\n` +
          `Create the two most educationally useful visuals for this exact text.`;

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

              temperature: 0.1,

              max_tokens: 1100,

              response_format: {
                type: "json_schema",

                json_schema: {
                  type: "object",

                  properties: {
                    text_type: {
                      type: "string",
                    },

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

                          scene_mode: {
                            type: "string",
                          },

                          scene_goal: {
                            type: "string",
                          },

                          must_include: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },

                          must_avoid: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },

                          image_prompt: {
                            type: "string",
                          },
                        },

                        required: [
                          "caption",
                          "scene_mode",
                          "scene_goal",
                          "must_include",
                          "must_avoid",
                          "image_prompt",
                        ],
                      },
                    },
                  },

                  required: [
                    "text_type",
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
          const clean =
            sceneData
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();

          const start =
            clean.indexOf("{");

          const end =
            clean.lastIndexOf("}");

          sceneData =
            JSON.parse(
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

            const mode =
              scene.scene_mode === "symbolic"
                ? "symbolic"
                : "literal";

            const goal =
              String(scene.scene_goal || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 220);

            const mustInclude =
              Array.isArray(scene.must_include)
                ? scene.must_include
                    .map((x) =>
                      String(x)
                        .replace(/\s+/g, " ")
                        .trim()
                    )
                    .filter(Boolean)
                    .slice(0, 8)
                : [];

            const mustAvoid =
              Array.isArray(scene.must_avoid)
                ? scene.must_avoid
                    .map((x) =>
                      String(x)
                        .replace(/\s+/g, " ")
                        .trim()
                    )
                    .filter(Boolean)
                    .slice(0, 8)
                : [];

            const basePrompt =
              String(scene.image_prompt || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 1050);

            const structuredPrompt =
              [
                `MODE: ${mode}.`,

                goal
                  ? `LEARNING GOAL: ${goal}.`
                  : "",

                mustInclude.length
                  ? `MUST INCLUDE: ${mustInclude.join("; ")}.`
                  : "",

                mustAvoid.length
                  ? `MUST AVOID: ${mustAvoid.join("; ")}.`
                  : "",

                `VISUAL DESCRIPTION: ${basePrompt}`,
              ]
                .filter(Boolean)
                .join(" ")
                .slice(0, 1500);

            return {
              caption,
              image_prompt: structuredPrompt,
            };
          });

        return json({
          success: true,
          text_type:
            sceneData.text_type || "mixed",
          scenes,
        });
      }

      // ==================================================
      // 2) PLANLANAN SAHNEDEN GÖRSEL ÜRET
      // ==================================================

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
            .slice(0, 1500);

        const finalPrompt = (
          `Clear educational illustration for a dual-coding learning tool. ` +

          `Follow the requested scene faithfully. ` +

          `Prioritize factual and visual accuracy over decoration. ` +

          `Do not add unrelated people, animals, objects, scenery or events. ` +

          `If the scene is scientific, historical or informational, ` +
          `prioritize clarity and source fidelity over cuteness. ` +

          `If the scene is symbolic, make the metaphor visually simple ` +
          `and easy to understand. ` +

          `Main learning-relevant elements should be large, recognizable and central. ` +

          `Single full-bleed illustration. ` +

          `Not a poster. ` +
          `Not a book cover. ` +
          `Not an infographic. ` +
          `Not a labeled diagram. ` +

          `Absolutely ZERO visible typography: ` +
          `no text, no words, no letters, no numbers, ` +
          `no title, no caption, no signs, no labels, ` +
          `no speech bubbles, no logo, no watermark. ` +

          `SCENE INSTRUCTIONS: ${compactPrompt}`
        ).slice(0, 1980);

        let result;

        try {
          result =
            await env.AI.run(
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
