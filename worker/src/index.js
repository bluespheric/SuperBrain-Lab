export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Tarayıcının CORS kontrolü
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Sadece POST isteği kabul et
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "SuperBrain Image Worker is running."
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    try {
      const body = await request.json();
      const prompt = body.prompt;

      if (!prompt || typeof prompt !== "string") {
        return new Response(
          JSON.stringify({ error: "Prompt is required." }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const finalPrompt = `
Warm, colorful children's storybook illustration.
Educational dual-coding visual for a child.
Clear composition, friendly characters, expressive actions.
No text, no letters, no words, no captions inside the image.

Scene:
${prompt}
      `.trim();

      const result = await env.AI.run(
        "@cf/black-forest-labs/flux-1-schnell",
        {
          prompt: finalPrompt,
          steps: 4,
          seed: Math.floor(Math.random() * 1000000),
        }
      );

      if (!result || !result.image) {
        throw new Error("No image returned from model.");
      }

      const dataUrl =
        `data:image/jpeg;charset=utf-8;base64,${result.image}`;

      return new Response(
        JSON.stringify({
          success: true,
          image: dataUrl,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error?.message || "Image generation failed.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
