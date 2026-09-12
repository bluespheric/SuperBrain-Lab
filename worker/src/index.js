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

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Worker kontrolü
    if (request.method === "GET") {
      return json({
        ok: true,
        message: "SuperBrain AI Worker is running.",
        imageModel: "FLUX.2 Klein 4B",
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
      // 1) HERHANGİ BİR METNİ ANALİZ ET
      //    VE EN UYGUN 2 GÖRSELİ PLANLA
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

The source can be ANY type of educational or literary text:
story, science, history, biography, explanation, instructions,
process, cause-effect text, comparison, description, poem,
abstract concept, or mixed text.

Your job is to create TWO visuals that help a learner understand
and remember the EXACT source text.

DO NOT create two generic attractive pictures.

==================================================
STEP 1 — UNDERSTAND THE SOURCE
==================================================

First determine what type of text it is.

Possible text types:

narrative
informational
process
cause_effect
historical
comparison
descriptive
abstract
mixed

Understand:

- Who or what are the important entities?
- What is each entity?
- What actions happen?
- Which objects matter?
- Which settings matter?
- Which relationships matter?
- What is the central idea?
- What are the two most visually useful moments or concepts?

==================================================
STEP 2 — CHOOSE TWO EDUCATIONAL VISUALS
==================================================

NARRATIVE:
Choose two SPECIFIC important events from the story.
Prefer a meaningful action / turning point and its consequence or resolution.

INFORMATIONAL OR SCIENCE:
First show the main concept.
Then show the mechanism, relationship, effect or concrete example.

PROCESS:
Choose two important chronological stages.

CAUSE_EFFECT:
Scene 1 = cause.
Scene 2 = effect.

HISTORICAL OR BIOGRAPHICAL:
Show two important source-grounded moments,
or an event followed by its consequence.

COMPARISON:
Use the scenes to make the two sides visually distinct.

DESCRIPTIVE:
Show two important concrete aspects of the described subject.

ABSTRACT:
Use literal imagery from the source whenever possible.
Only if the idea cannot be shown literally,
use a simple educational metaphor and mark the scene as symbolic.

MIXED:
Choose the two visuals with the greatest learning value.

==================================================
STRICT SOURCE FIDELITY
==================================================

For LITERAL scenes:

1. Use the identities and relationships given by the source text.

2. Preserve species, object types, roles and important descriptions.

Examples:

If the source says:
"Sincap Ceviz"
then this entity is a squirrel.

If the source says:
"Kirpi Diken"
then this entity is a hedgehog.

If the source says:
"Tavşan Tonton"
then this entity is a rabbit.

But these are only EXAMPLES.
Never assume the source contains animals.
Analyze every new source independently.

3. Do NOT rely only on proper names.

Translate names into visible descriptions inside image_prompt.

For example:

Do not write only:
"Ceviz"

Instead write:
"a small brown squirrel named Ceviz"

Do not write only:
"Diken"

Instead write:
"a small hedgehog named Diken"

4. If the same entity appears in both scenes,
repeat its important visible characteristics in BOTH prompts.

5. Never silently change an entity into something else.

A squirrel must not become a rabbit.
A hedgehog must not become a dog.
A microscope must not become a telescope.
A ship must not become a car.

6. Preserve important actions.

If A gives an object to B,
the image must visibly show A giving that object to B.

7. Preserve important objects.

If the source says "a basket full of carrots",
do not replace it with random food.

8. Preserve important relationships.

Friend, teacher, parent, enemy, customer, scientist,
animal, historical figure, object, process, etc.
must be represented according to context.

9. Do not add random humans.

10. Do not add random animals.

11. Do not add random objects or scenery merely for decoration.

12. If the source does NOT contain people,
do not automatically insert children or adults.

13. If the source does NOT contain animals,
do not automatically insert animals.

==================================================
SCENE REQUIREMENTS
==================================================

Every scene must include:

caption
scene_mode
scene_goal
must_include
must_avoid
image_prompt

scene_mode must be:

"literal"

or

"symbolic"

scene_goal:
Explain in one short sentence what the learner should remember.

must_include:
List 2 to 8 MANDATORY visual facts.

These are not suggestions.
They are required.

Example format only:

[
  "one small white rabbit",
  "one brown squirrel",
  "basket full of carrots",
  "rabbit visibly handing carrots to squirrel"
]

must_avoid:
List 2 to 8 things that would make the scene inaccurate.

For example:

[
  "humans",
  "extra rabbits",
  "unrelated animals",
  "written words"
]

These examples are NOT permanent rules.
Generate them dynamically from the actual source.

==================================================
IMAGE PROMPT RULES
==================================================

image_prompt MUST ALWAYS be in ENGLISH.

caption MUST be in ${captionLanguage}.

The prompt must describe:

- exact subjects
- exact roles
- visible appearance when known
- exact action
- important objects
- setting
- composition

Do not use vague prompts like:

"friendship"
"history"
"photosynthesis"

Describe what must literally be visible.

IMPORTANT:

No visible writing inside the illustration.

NO:
text
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

Do not request:

poster
book cover
worksheet
title page
infographic
labeled diagram
comic page

The image itself should be a single clean visual scene.

Return EXACTLY:

{
  "text_type": "type",
  "scenes": [
    {
      "caption": "short caption",
      "scene_mode": "literal",
      "scene_goal": "learning goal",
      "must_include": [
        "mandatory element",
        "mandatory element"
      ],
      "must_avoid": [
        "incorrect element",
        "irrelevant element"
      ],
      "image_prompt": "detailed English visual description"
    },
    {
      "caption": "short caption",
      "scene_mode": "literal",
      "scene_goal": "learning goal",
      "must_include": [
        "mandatory element",
        "mandatory element"
      ],
      "must_avoid": [
        "incorrect element",
        "irrelevant element"
      ],
      "image_prompt": "detailed English visual description"
    }
  ]
}
        `.trim();

        const userPrompt =
          `SOURCE TEXT:\n${text}\n\n` +
          `Create the two most educationally useful and source-faithful visuals for this exact text.`;

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
              max_tokens: 1200,

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

        let sceneData = response?.response;

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
                .slice(0, 950);

            const structuredPrompt =
              [
                `SCENE MODE: ${mode}.`,

                goal
                  ? `LEARNING GOAL: ${goal}.`
                  : "",

                mustInclude.length
                  ? `MANDATORY ELEMENTS — EVERY ONE MUST BE VISIBLE: ${mustInclude.join("; ")}.`
                  : "",

                mustAvoid.length
                  ? `DO NOT SHOW: ${mustAvoid.join("; ")}.`
                  : "",

                `EXACT VISUAL SCENE: ${basePrompt}`,
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
      // 2) FLUX.2 KLEIN 4B İLE GÖRSEL ÜRET
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
            .slice(0, 1550);

        const finalPrompt = (
          `Educational dual-coding illustration. ` +

          `Follow the source-grounded scene instructions with very high fidelity. ` +

          `MANDATORY ELEMENTS are strict requirements. ` +
          `Every mandatory element must appear visibly and recognizably. ` +

          `DO NOT SHOW items are strict exclusions. ` +

          `Do not replace requested subjects with similar-looking subjects. ` +

          `Do not change a person's role, animal species, object type, scientific object, historical object, location type, or important action. ` +

          `Do not add unrelated people, animals, objects or events. ` +

          `Prioritize semantic accuracy and educational clarity over decoration. ` +

          `Use one coherent scene with the learning-relevant subjects large and clearly visible. ` +

          `Polished high-quality children's educational illustration when the source is a story. ` +

          `For scientific, historical, informational or non-fiction content, use an age-appropriate educational illustration style rather than making it unnecessarily cute. ` +

          `Absolutely no visible typography. ` +
          `No text, words, letters, numbers, titles, captions, signs, labels, speech bubbles, logos or watermarks. ` +

          `Do not make a poster, book cover, worksheet, infographic or title card. ` +

          `SCENE: ${compactPrompt}`
        ).slice(0, 3000);

        try {
          // FLUX.2 Klein Cloudflare'da multipart FormData ister.
          const form = new FormData();

          form.append(
            "prompt",
            finalPrompt
          );

          // Prompta daha sıkı bağlı kalması için.
          form.append(
            "guidance",
            "4"
          );

          // Zihin Sineması kartlarına uygun 4:3 yatay görsel.
          form.append(
  "width",
  "512"
);

form.append(
  "height",
  "512"
);

          // FormData'yı Cloudflare'ın istediği multipart biçimine çevir.
          const formResponse =
            new Response(form);

          const formStream =
            formResponse.body;

          const formContentType =
            formResponse.headers.get(
              "content-type"
            );

          const result =
            await env.AI.run(
              "@cf/black-forest-labs/flux-2-klein-4b",
              {
                multipart: {
                  body: formStream,
                  contentType: formContentType,
                },
              }
            );

          if (
            !result ||
            !result.image
          ) {
            return json(
              {
                success: false,
                where: "image_generation",
                error:
                  "FLUX.2 returned no image.",
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
