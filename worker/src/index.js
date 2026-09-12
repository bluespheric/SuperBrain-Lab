export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === "GET") {
      return Response.json(
        {
          ok: true,
          message: "SuperBrain AI Worker is running.",
        },
        {
          headers: corsHeaders,
        }
      );
    }

    if (request.method !== "POST") {
      return Response.json(
        { success: false, error: "Method not allowed." },
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

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

    try {
      const body = await request.json();
      const action = body.action || "image";

      // --------------------------------------------------
      // 1) METNİ 2 GÖRSEL SAHNEYE AYIR
      // --------------------------------------------------
      if (action === "scenes") {
        const text = body.text;
        const lang = body.lang === "en" ? "en" : "tr";

        if (!text || typeof text !== "string") {
          return Response.json(
            { success: false, error: "Text is required." },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const systemPrompt =
          lang === "en"
            ? `You create educational dual-coding scenes for children.
Return exactly 2 sequential visual scenes.
Captions must be short and child-friendly.
Image prompts must clearly describe setting, characters, actions and colors.
Keep image prompts concise and clear.
The images must contain no text, letters, captions, labels or words.`
            : `Çocuklar için eğitsel dual coding sahneleri hazırlıyorsun.
Tam olarak 2 ardışık görsel sahne üret.
Başlıklar kısa, açık ve çocuk dostu olsun.
Görsel tarifleri kısa ama net olsun; mekânı, karakterleri, hareketleri ve renkleri açıkça anlat.
Görsellerin içinde kesinlikle yazı, harf, etiket veya kelime bulunmamalı.`;

        const userPrompt =
          lang === "en"
            ? `Story text:\n${text}`
            : `Hikâye metni:\n${text}`;

        const response = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 400,
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
                        caption: { type: "string" },
                        image_prompt: { type: "string" },
                      },
                      required: ["caption", "image_prompt"],
                    },
                  },
                },
                required: ["scenes"],
              },
            },
          }
        );

        let sceneData = response.response;

        if (typeof sceneData === "string") {
          sceneData = JSON.parse(sceneData);
        }

        if (
          !sceneData ||
          !Array.isArray(sceneData.scenes) ||
          sceneData.scenes.length !== 2
        ) {
          throw new Error("Scene generation failed.");
        }

        // Güvenlik için image promptları fazla uzunsa kısalt
        sceneData.scenes = sceneData.scenes.map((scene) => ({
          caption: String(scene.caption || "").trim().slice(0, 120),
          image_prompt: String(scene.image_prompt || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1200),
        }));

        return Response.json(
          {
            success: true,
            scenes: sceneData.scenes,
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // --------------------------------------------------
      // 2) GÖRSEL ÜRET
      // --------------------------------------------------
      if (action === "image") {
        const prompt = body.prompt;

        if (!prompt || typeof prompt !== "string") {
          return Response.json(
            { success: false, error: "Prompt is required." },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const compactPrompt = String(prompt)
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1400);

        const finalPrompt = (
          `Warm colorful children's storybook illustration. ` +
          `Friendly age-appropriate characters. ` +
          `Clear action and easy-to-understand composition. ` +
          `No text, no letters, no labels, no captions inside the image. ` +
          `Scene: ${compactPrompt}`
        ).slice(0, 1800);

        let result;
        try {
          result = await env.AI.run(
            "@cf/black-forest-labs/flux-1-schnell",
            {
              prompt: finalPrompt,
              steps: 4,
              seed: Math.floor(Math.random() * 1000000),
            }
          );
        } catch (aiError) {
          return Response.json(
            {
              success: false,
              where: "image_generation",
              error: safeErrorText(aiError),
            },
            {
              status: 500,
              headers: corsHeaders,
            }
          );
        }

        if (!result || !result.image) {
          return Response.json(
            {
              success: false,
              where: "image_generation",
              error: "No image returned from model.",
              raw: (() => {
                try {
                  return JSON.stringify(result).slice(0, 500);
                } catch {
                  return "Could not stringify model response.";
                }
              })(),
            },
            {
              status: 500,
              headers: corsHeaders,
            }
          );
        }

        const dataUrl = `data:image/jpeg;charset=utf-8;base64,${result.image}`;

        return Response.json(
          {
            success: true,
            image: dataUrl,
          },
          {
            headers: corsHeaders,
          }
        );
      }

      return Response.json(
        {
          success: false,
          error: "Unknown action.",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: safeErrorText(error),
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};
