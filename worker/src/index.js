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

    const parseAIJson = (value) => {
      if (value && typeof value === "object") return value;
      const clean = String(value || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      return JSON.parse(
        start !== -1 && end !== -1 ? clean.slice(start, end + 1) : clean
      );
    };

    const cleanOneLine = (value, max = 220) =>
      String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

    const commonLearningRules = (lang) => {
      const languageRule =
        lang === "en"
          ? "Write in natural, child-friendly English at approximately A2-B1 level."
          : "Doğal, temiz ve 8-10 yaşındaki bir çocuğun rahatça anlayacağı Türkçe kullan.";

      return `
You are the educational language engine of SuperBrain Lab.
The learner may have ADHD and/or dyslexia.

${languageRule}

ACCESSIBILITY AND PEDAGOGY RULES:
- Keep cognitive load low.
- Use short, clear, concrete sentences.
- Present one idea at a time.
- Prefer familiar words over academic jargon.
- Be warm, lively and encouraging, but never babyish or patronizing.
- Avoid long introductions, filler, repetition and dense paragraphs.
- Avoid parentheses unless absolutely necessary.
- Do not mention pedagogy, psychology, diagnoses, theorists, authors or teaching theory.
- Do not explain your instructions.
- Do not use markdown, asterisks or headings unless the requested JSON field itself needs text.
- Preserve the meaning of the user's source. Do not invent unsupported facts.
- Make the output immediately usable in a child-facing interface.
- When possible, keep each sentence under about 14 words.
      `.trim();
    };

    const runStructuredText = async ({
      lang,
      taskPrompt,
      schema,
      maxTokens = 700,
    }) => {
      const response = await env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct-fast",
        {
          messages: [
            {
              role: "system",
              content: commonLearningRules(lang),
            },
            {
              role: "user",
              content: taskPrompt,
            },
          ],
          temperature: 0.15,
          max_tokens: maxTokens,
          response_format: {
            type: "json_schema",
            json_schema: schema,
          },
        }
      );

      return parseAIJson(response?.response);
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
        textModel: "Llama 3.1 8B Instruct Fast",
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
      const lang = body.lang === "en" ? "en" : "tr";

      // ==================================================
      // 1) PARÇALARA AYIR / JIGSAW
      // ==================================================
      if (action === "jigsaw") {
        const text = cleanOneLine(body.text, 12000);

        if (!text) {
          return json(
            {
              success: false,
              error: "Text is required.",
            },
            400
          );
        }

        const taskPrompt =
          lang === "en"
            ? `SOURCE TEXT:
${text}

Find the core meaning and split it into exactly 3 easy pieces.
- big_picture: exactly 1 short, exciting sentence.
- pieces: exactly 3 short items.
- If it is a story, follow the important event order.
- If it is informational, use the three most useful ideas.
- Keep every item source-grounded and specific.`
            : `KAYNAK METİN:
${text}

Metnin özünü bul ve tam 3 küçük parçaya ayır.
- buyuk_resim: tam 1 kısa, merak uyandıran cümle.
- kenar_parcalari: tam 3 kısa madde.
- Metin hikâyeyse önemli olay sırasını koru.
- Bilgilendiriciyse en gerekli üç fikri seç.
- Her madde metne sadık ve somut olsun.`;

        const schema = {
          type: "object",
          properties: {
            buyuk_resim: {
              type: "string",
            },
            kenar_parcalari: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "string",
              },
            },
          },
          required: ["buyuk_resim", "kenar_parcalari"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 450,
        });

        return json({
          success: true,
          buyuk_resim: cleanOneLine(data.buyuk_resim, 180),
          kenar_parcalari: (data.kenar_parcalari || [])
            .slice(0, 3)
            .map((x) => cleanOneLine(x, 170)),
        });
      }

      // ==================================================
      // 2) HAFIZA SARAYI
      // ==================================================
      if (action === "palace") {
        const text = cleanOneLine(body.text, 12000);

        if (!text) {
          return json(
            {
              success: false,
              error: "Text is required.",
            },
            400
          );
        }

        const taskPrompt =
          lang === "en"
            ? `SOURCE TEXT:
${text}

Create exactly 3 memorable memory-palace cues.
Room 1 is a living room. Room 2 is a kitchen. Room 3 is a bookshelf/reading corner.
For each room, connect one important source idea to one vivid concrete object or tiny action in that room.
Each cue must be one short sentence, easy to picture, and faithful to the source.
Use one suitable emoji icon per room. Do not repeat the same fact in all rooms.`
            : `KAYNAK METİN:
${text}

Tam 3 unutulmaz hafıza sarayı ipucu oluştur.
1. oda oturma odası, 2. oda mutfak, 3. oda kitaplık/okuma köşesi.
Her odada metindeki önemli bir bilgiyi o odaya ait somut bir nesne veya minicik bir hareketle bağla.
Her ipucu tek kısa cümle olsun, gözde kolay canlansın ve metne sadık kalsın.
Her oda için uygun tek bir emoji seç. Aynı bilgiyi üç odada tekrar etme.`;

        const schema = {
          type: "object",
          properties: {
            room1_icon: {
              type: "string",
            },
            room1_cue: {
              type: "string",
            },
            room2_icon: {
              type: "string",
            },
            room2_cue: {
              type: "string",
            },
            room3_icon: {
              type: "string",
            },
            room3_cue: {
              type: "string",
            },
          },
          required: [
            "room1_icon",
            "room1_cue",
            "room2_icon",
            "room2_cue",
            "room3_icon",
            "room3_cue",
          ],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 520,
        });

        return json({
          success: true,
          room1_icon: cleanOneLine(data.room1_icon, 8) || "🛋️",
          room1_cue: cleanOneLine(data.room1_cue, 180),
          room2_icon: cleanOneLine(data.room2_icon, 8) || "🍳",
          room2_cue: cleanOneLine(data.room2_cue, 180),
          room3_icon: cleanOneLine(data.room3_icon, 8) || "📚",
          room3_cue: cleanOneLine(data.room3_cue, 180),
        });
      }

      // ==================================================
      // 3) TEKERLEME
      // ==================================================
      if (action === "mnemonic") {
        const word = cleanOneLine(body.word, 80);

        if (!word) {
          return json(
            {
              success: false,
              error: "Word is required.",
            },
            400
          );
        }

        const taskPrompt =
          lang === "en"
            ? `TARGET WORD: ${word}

Write exactly 2 very short rhyming lines for a child.
Make them playful, memorable and easy to say aloud.
Use the target word naturally in at least one line.
Avoid difficult vocabulary and avoid random nonsense that does not help memory.`
            : `HEDEF KELİME: ${word}

Çocuk için tam 2 çok kısa kafiyeli tekerleme satırı yaz.
Eğlenceli, akılda kalıcı ve yüksek sesle kolay söylenebilir olsun.
Hedef kelimeyi en az bir satırda doğal biçimde kullan.
Zor sözcüklerden ve hatırlamaya yardım etmeyen anlamsız ifadelerden kaçın.`;

        const schema = {
          type: "object",
          properties: {
            lines: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: {
                type: "string",
              },
            },
          },
          required: ["lines"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 280,
        });

        return json({
          success: true,
          lines: (data.lines || [])
            .slice(0, 2)
            .map((x) => cleanOneLine(x, 120)),
        });
      }

      // ==================================================
      // 4) ZİHİN AĞACI / MIND MAP
      // ==================================================
      if (action === "mindmap") {
        const text = cleanOneLine(body.text, 12000);

        if (!text) {
          return json(
            {
              success: false,
              error: "Text is required.",
            },
            400
          );
        }

        const taskPrompt =
          lang === "en"
            ? `SOURCE TEXT:
${text}

Create a tiny mind map.
- root: the central idea in 2-6 simple words.
- branches: exactly 3 source-grounded branches.
Each branch should contain only one important idea and be easy to scan quickly.
Do not repeat the root wording as a branch.`
            : `KAYNAK METİN:
${text}

Mini bir zihin haritası oluştur.
- root: merkez fikir, 2-6 basit kelime.
- branches: metne dayalı tam 3 dal.
Her dal yalnızca bir önemli fikir taşısın ve hızlıca okunabilsin.
Merkez fikri dallarda aynen tekrar etme.`;

        const schema = {
          type: "object",
          properties: {
            root: {
              type: "string",
            },
            branches: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "string",
              },
            },
          },
          required: ["root", "branches"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 420,
        });

        return json({
          success: true,
          root: cleanOneLine(data.root, 90),
          branches: (data.branches || [])
            .slice(0, 3)
            .map((x) => cleanOneLine(x, 150)),
        });
      }

      // ==================================================
      // 5) GÖREV DİLİMLERİ
      // ==================================================
      if (action === "chunks") {
        const task = cleanOneLine(body.task, 1500);

        if (!task) {
          return json(
            {
              success: false,
              error: "Task is required.",
            },
            400
          );
        }

        const taskPrompt =
          lang === "en"
            ? `TASK: ${task}

Split this into exactly 3 small, startable micro-steps for a child who may struggle with task initiation.
Every step must include a realistic time estimate in minutes.
Start each step with a concrete action verb.
Keep each step short and specific.
Do not write motivational speeches.`
            : `GÖREV: ${task}

Bunu göreve başlaması zor olabilen bir çocuk için tam 3 küçük ve başlanabilir adıma böl.
Her adımda gerçekçi bir dakika süresi açıkça yazsın.
Her adımı somut bir eylem fiiliyle başlat.
Kısa ve belirgin tut. Motivasyon konuşması ekleme.`;

        const schema = {
          type: "object",
          properties: {
            chunks: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "string",
              },
            },
          },
          required: ["chunks"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 380,
        });

        return json({
          success: true,
          chunks: (data.chunks || [])
            .slice(0, 3)
            .map((x) => cleanOneLine(x, 170)),
        });
      }

      // ==================================================
      // 6) HENÜZ / GROWTH MINDSET
      // ==================================================
      if (action === "growth") {
        const goal = cleanOneLine(body.goal, 700);

        if (!goal) {
          return json(
            {
              success: false,
              error: "Goal is required.",
            },
            400
          );
        }

        const taskPrompt =
          lang === "en"
            ? `LEARNER'S STATEMENT OR GOAL: ${goal}

Rewrite it as exactly one short, punchy growth-mindset sentence for a child.
Keep the original goal recognizable.
Use realistic encouragement, not exaggerated praise.
Do not use a quote, author name, theory or explanation.
The interface will add the word YET separately, so do not force it into the sentence.`
            : `ÖĞRENCİNİN CÜMLESİ VEYA HEDEFİ: ${goal}

Bunu çocuk için tam bir kısa ve vurucu gelişim zihniyeti cümlesine dönüştür.
Asıl hedef tanınabilir kalsın.
Abartılı övgü yerine gerçekçi cesaret ver.
Alıntı, kuramcı, teori veya açıklama ekleme.
Arayüz HENÜZ kelimesini ayrıca ekleyecek; cümleye zorla ekleme.`;

        const schema = {
          type: "object",
          properties: {
            text: {
              type: "string",
            },
          },
          required: ["text"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 220,
        });

        return json({
          success: true,
          text: cleanOneLine(data.text, 180),
        });
      }

      // ==================================================
      // 7) METNİ ANALİZ ET VE 2 GÖRSEL PLANLA
      // ==================================================
      if (action === "scenes") {
        const text =
          typeof body.text === "string"
            ? body.text.trim()
            : "";

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

STEP 1 — UNDERSTAND THE SOURCE
Determine the text type: narrative, informational, process, cause_effect,
historical, comparison, descriptive, abstract, or mixed.
Understand the important entities, actions, objects, settings, relationships,
central idea, and the two most visually useful moments or concepts.

STEP 2 — CHOOSE TWO EDUCATIONAL VISUALS
NARRATIVE: choose two specific important events.
INFORMATIONAL OR SCIENCE: show the main concept, then mechanism/effect/example.
PROCESS: choose two important chronological stages.
CAUSE_EFFECT: Scene 1 = cause, Scene 2 = effect.
HISTORICAL OR BIOGRAPHICAL: two source-grounded moments or event + consequence.
COMPARISON: make the two sides visually distinct.
DESCRIPTIVE: show two important concrete aspects.
ABSTRACT: use literal imagery when possible; otherwise a simple symbolic metaphor.
MIXED: choose the two visuals with greatest learning value.

STRICT SOURCE FIDELITY
- Preserve identities, species, object types, roles and important descriptions.
- Do not rely on proper names alone; convert them into visible descriptions.
- If the same entity appears twice, repeat its important visual characteristics.
- Never silently change an entity into something else.
- Preserve important actions, objects and relationships.
- Do not add random humans, animals, objects or scenery.
- Analyze each source independently.

SCENE REQUIREMENTS
Every scene must include caption, scene_mode, scene_goal, must_include,
must_avoid and image_prompt.
scene_mode is literal or symbolic.
must_include contains 2 to 8 mandatory visual facts.
must_avoid contains 2 to 8 inaccuracies or irrelevant additions to exclude.

IMAGE PROMPT RULES
- image_prompt MUST ALWAYS be in English.
- caption MUST be in ${captionLanguage}.
- Describe exact subjects, roles, appearance, action, objects, setting, composition.
- No vague concepts when concrete visuals are possible.
- No visible text, words, letters, numbers, titles, captions, signs, labels,
  speech bubbles, logos or watermarks.
- Do not request a poster, book cover, worksheet, title page, infographic or comic page.
- The image must be one clean visual scene.
        `.trim();

        const userPrompt =
          `SOURCE TEXT:
${text}

Create the two most educationally useful and source-faithful visuals for this exact text.`;

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
                  required: ["text_type", "scenes"],
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

        let sceneData = parseAIJson(response?.response);

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
              cleanOneLine(scene.caption, 140);

            const mode =
              scene.scene_mode === "symbolic"
                ? "symbolic"
                : "literal";

            const goal =
              cleanOneLine(scene.scene_goal, 220);

            const mustInclude =
              Array.isArray(scene.must_include)
                ? scene.must_include
                    .map((x) =>
                      cleanOneLine(x, 160)
                    )
                    .filter(Boolean)
                    .slice(0, 8)
                : [];

            const mustAvoid =
              Array.isArray(scene.must_avoid)
                ? scene.must_avoid
                    .map((x) =>
                      cleanOneLine(x, 160)
                    )
                    .filter(Boolean)
                    .slice(0, 8)
                : [];

            const basePrompt =
              cleanOneLine(
                scene.image_prompt,
                950
              );

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
      // 8) FLUX.2 KLEIN 4B İLE GÖRSEL ÜRET
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
          `MANDATORY ELEMENTS are strict requirements. Every mandatory element must appear visibly and recognizably. ` +
          `DO NOT SHOW items are strict exclusions. ` +
          `Do not replace requested subjects with similar-looking subjects. ` +
          `Do not change a person's role, animal species, object type, scientific object, historical object, location type, or important action. ` +
          `Do not add unrelated people, animals, objects or events. ` +
          `Prioritize semantic accuracy and educational clarity over decoration. ` +
          `Use one coherent scene with the learning-relevant subjects large and clearly visible. ` +
          `Polished high-quality children's educational illustration when the source is a story. ` +
          `For scientific, historical, informational or non-fiction content, use an age-appropriate educational illustration style rather than making it unnecessarily cute. ` +
          `Absolutely no visible typography. No text, words, letters, numbers, titles, captions, signs, labels, speech bubbles, logos or watermarks. ` +
          `Do not make a poster, book cover, worksheet, infographic or title card. ` +
          `SCENE: ${compactPrompt}`
        ).slice(0, 3000);

        try {
          const form = new FormData();

          form.append(
            "prompt",
            finalPrompt
          );

          form.append(
            "guidance",
            "4"
          );

          form.append(
            "width",
            "512"
          );

          form.append(
            "height",
            "512"
          );

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
