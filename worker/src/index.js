export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const json = (data, status = 200) =>
      Response.json(data, { status, headers: corsHeaders });

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

    const extractModelPayload = (result) => {
      if (result == null) return result;
      if (result.response !== undefined) return result.response;
      if (result.choices?.[0]?.message?.content !== undefined) {
        return result.choices[0].message.content;
      }
      return result;
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

    const cleanOneLine = (value, max = 320) =>
      String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

    const cleanMultiLine = (value, max = 1200) =>
      String(value || "")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, max);

    const DEEP_TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const FALLBACK_TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
    const SCENE_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

    const commonLearningRules = (lang) => {
      const languageRule =
        lang === "en"
          ? "Write in natural, child-friendly English around A2-B1 level unless the source requires a specific term."
          : "Doğal, temiz ve çocuk dostu Türkçe kullan. Kaynaktaki gerekli bilimsel ya da özel terimleri bozma; gerekirse kısa biçimde açıkla.";

      return `
You are the educational reasoning engine of SuperBrain Lab.
The learner may have ADHD and/or dyslexia.

${languageRule}

CORE PRINCIPLES:
- Accessibility is NOT the same as oversimplification.
- Keep essential facts, causes, consequences, quantities, sequence, contrasts and relationships.
- Reduce cognitive load by CHUNKING information, not by deleting meaningful detail.
- Prefer 1-3 short sentences per item when the task needs explanation.
- Use concrete wording and specific details from the source.
- When the source is complex, preserve its logic and nuance in child-friendly form.
- Avoid generic filler and repeated praise.
- Do not start every response with the same phrase such as "Harika" or "Aferin".
- Vary wording naturally across outputs.
- Never invent unsupported facts about the source.
- Do not mention pedagogy, diagnoses, theorists or teaching theory to the learner.
- Do not use markdown, asterisks or long headings inside returned fields.
- Do not be babyish, patronizing or unrealistically enthusiastic.
- When quantities or time estimates matter, reason about them realistically.
- If a task says 10 questions, the plan must account for all 10 questions.
- A child-friendly answer may be concise, but it must still be substantively useful.
      `.trim();
    };

    const runStructuredText = async ({
      lang,
      taskPrompt,
      schema,
      maxTokens = 900,
      temperature = 0.35,
      frequencyPenalty = 0.25,
      presencePenalty = 0.12,
      repetitionPenalty = 1.08,
    }) => {
      const input = {
        messages: [
          { role: "system", content: commonLearningRules(lang) },
          { role: "user", content: taskPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: 0.9,
        repetition_penalty: repetitionPenalty,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        response_format: {
          type: "json_schema",
          json_schema: schema,
        },
      };

      try {
        const result = await env.AI.run(DEEP_TEXT_MODEL, input);
        return parseAIJson(extractModelPayload(result));
      } catch (primaryError) {
        console.log("Deep model fallback:", safeErrorText(primaryError));
        const fallback = await env.AI.run(FALLBACK_TEXT_MODEL, input);
        return parseAIJson(extractModelPayload(fallback));
      }
    };


    const missionSystemPrompt = `
You are the curriculum architect for Deep Sea Lab / Bathysphere, an English-learning game with 30 fixed interaction mechanics.

CRITICAL INTERPRETATION RULE:
Words such as fener, kablo, vana, kargo, mikroskop, boru, radyo, periskop, terazi, mors, salter and UV are INTERNAL GAME MECHANICS.
They are not lesson topics.
Never teach the meaning of "fener", "kablo", "valve", "cable", "spotlight", "submarine hardware", etc. unless the teacher's source explicitly teaches those words.
Instead, treat each mechanic as a container for the teacher's actual language objective.

Your job is to transform the teacher's source AND the shared lesson blueprint into a coherent sequence of playable English-learning tasks.

WHEN THE TEACHER'S PROMPT IS SPARSE:
- Infer a sensible classroom micro-curriculum from the explicit topic, CEFR level, age, grammar point, skill, or vocabulary theme.
- You may create ordinary example sentences and familiar situations that are clearly compatible with the stated target.
- Do not invent unrelated academic content, obscure facts, or new curriculum goals.
- If the teacher says only "A1 Past Simple + sports", you should still be able to build a coherent lesson using common A1 sports vocabulary and simple past forms.

QUALITY RULES:
- Every station must have a clear learning purpose.
- Sequence difficulty gradually: recognition -> controlled practice -> comprehension -> production -> transfer/application.
- Make stations meaningfully different from each other.
- Avoid repeating the same target word, sentence, or question pattern without a deliberate reason.
- Preserve important details from uploaded source material.
- Correct answers must be unambiguous.
- Distractors must be plausible, level-appropriate, and clearly wrong.
- Student-facing prompts should be concise, natural and playable.
- Respect any stated CEFR level, learner age, grammar target, vocabulary set, communicative aim, or source facts.
- The deep-sea theme is only a narrative wrapper.
- Never let the theme replace the English-learning objective.
- Do not explain pedagogy to the student.
- For writing tasks, include multiple accepted answer variants when more than one genuinely valid answer should be accepted.
- For listening stations, the transcript is the editable source of truth for generated audio.
- Do not add customImg or customAudio fields. Media is attached separately.
- Return only data matching the requested JSON schema.
    `.trim();

    const runMissionStructuredText = async ({ taskPrompt, schema, maxTokens = 2600 }) => {
      const input = {
        messages: [
          { role: "system", content: missionSystemPrompt },
          { role: "user", content: taskPrompt },
        ],
        temperature: 0.38,
        max_tokens: maxTokens,
        top_p: 0.9,
        repetition_penalty: 1.07,
        frequency_penalty: 0.2,
        presence_penalty: 0.08,
        response_format: { type: "json_schema", json_schema: schema },
      };

      try {
        const result = await env.AI.run(DEEP_TEXT_MODEL, input);
        return parseAIJson(extractModelPayload(result));
      } catch (primaryError) {
        console.log("Mission deep model fallback:", safeErrorText(primaryError));
        const fallback = await env.AI.run(FALLBACK_TEXT_MODEL, input);
        return parseAIJson(extractModelPayload(fallback));
      }
    };

    const str = (max = 500) => ({ type: "string", maxLength: max });
    const strArr = (min, max, itemMax = 180) => ({
      type: "array", minItems: min, maxItems: max, items: str(itemMax),
    });

    const visualSchema = {
      type: "array", minItems: 0, maxItems: 3,
      items: {
        type: "object",
        properties: {
          stationId: { type: "integer" },
          prompt: str(900),
          reason: str(240),
          priority: { type: "integer", minimum: 1, maximum: 5 },
        },
        required: ["stationId", "prompt", "reason", "priority"],
      },
    };

    const stationSchemas = {
      1: { type: "object", properties: {
        "1": { type: "object", properties: { type:{type:"string",enum:["fener"]}, prompt:str(), target:str(120), decoys:strArr(2,2,120) }, required:["type","prompt","target","decoys"] },
        "2": { type: "object", properties: { type:{type:"string",enum:["kablo"]}, prompt:str(), source:str(180), correct:str(180), distractors:strArr(2,2,180) }, required:["type","prompt","source","correct","distractors"] },
        "3": { type: "object", properties: { type:{type:"string",enum:["vana"]}, prompt:str(), targetVal:str(120), choices:strArr(3,3,120) }, required:["type","prompt","targetVal","choices"] },
        "4": { type: "object", properties: { type:{type:"string",enum:["kargo"]}, prompt:str(), cargo:str(180), correct:str(180), distractors:strArr(2,2,180) }, required:["type","prompt","cargo","correct","distractors"] },
        "5": { type: "object", properties: { type:{type:"string",enum:["mikroskop"]}, prompt:str(), label:str(160), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","label","correct","distractors"] },
      }, required:["1","2","3","4","5"] },
      2: { type: "object", properties: {
        "6": { type:"object", properties:{ type:{type:"string",enum:["boru"]}, prompt:str(), sentence:str(260) }, required:["type","prompt","sentence"] },
        "7": { type:"object", properties:{ type:{type:"string",enum:["radyo"]}, prompt:str(), targetFreq:{type:"integer",minimum:82,maximum:138} }, required:["type","prompt","targetFreq"] },
        "8": { type:"object", properties:{ type:{type:"string",enum:["periskop"]}, prompt:str(), correctErr:str(240), normals:strArr(2,2,240) }, required:["type","prompt","correctErr","normals"] },
        "9": { type:"object", properties:{ type:{type:"string",enum:["terazi"]}, prompt:str(), subject:str(180), correct:str(120), distractor:str(120) }, required:["type","prompt","subject","correct","distractor"] },
        "10": { type:"object", properties:{ type:{type:"string",enum:["mors"]}, prompt:str(), text:str(260), correct:str(120), distractors:strArr(2,2,120) }, required:["type","prompt","text","correct","distractors"] },
      }, required:["6","7","8","9","10"] },
      3: { type: "object", properties: {
        "11": { type:"object", properties:{ type:{type:"string",enum:["ses_sik"]}, prompt:str(), trans:str(300), correct:str(180), distractors:strArr(2,2,180) }, required:["type","prompt","trans","correct","distractors"] },
        "12": { type:"object", properties:{ type:{type:"string",enum:["ses_sik"]}, prompt:str(), trans:str(300), correct:str(180), distractors:strArr(2,2,180) }, required:["type","prompt","trans","correct","distractors"] },
        "13": { type:"object", properties:{ type:{type:"string",enum:["ses_sik"]}, prompt:str(), trans:str(300), correct:str(180), distractors:strArr(2,2,180) }, required:["type","prompt","trans","correct","distractors"] },
        "14": { type:"object", properties:{ type:{type:"string",enum:["ses_sik"]}, prompt:str(), trans:str(300), correct:str(180), distractors:strArr(2,2,180) }, required:["type","prompt","trans","correct","distractors"] },
        "15": { type:"object", properties:{ type:{type:"string",enum:["salter"]}, prompt:str(), trans:str(320), order:str(220) }, required:["type","prompt","trans","order"] },
      }, required:["11","12","13","14","15"] },
      4: { type: "object", properties: {
        "16": { type:"object", properties:{ type:{type:"string",enum:["uv"]}, prompt:str(), text:str(420), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","text","correct","distractors"] },
        "17": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "18": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "19": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "20": { type:"object", properties:{ type:{type:"string",enum:["tablo"]}, prompt:str(), tableHtml:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","tableHtml","correct","distractors"] },
      }, required:["16","17","18","19","20"] },
      5: { type: "object", properties: {
        "21": { type:"object", properties:{ type:{type:"string",enum:["yazma"]}, prompt:str(), hint:str(220), display:str(300), answers:str(220) }, required:["type","prompt","hint","display","answers"] },
        "22": { type:"object", properties:{ type:{type:"string",enum:["yazma"]}, prompt:str(), hint:str(220), display:str(300), answers:str(220) }, required:["type","prompt","hint","display","answers"] },
        "23": { type:"object", properties:{ type:{type:"string",enum:["yazma"]}, prompt:str(), hint:str(220), display:str(300), answers:str(220) }, required:["type","prompt","hint","display","answers"] },
        "24": { type:"object", properties:{ type:{type:"string",enum:["yazma"]}, prompt:str(), hint:str(220), display:str(300), answers:str(220) }, required:["type","prompt","hint","display","answers"] },
        "25": { type:"object", properties:{ type:{type:"string",enum:["yazma"]}, prompt:str(), hint:str(220), display:str(300), answers:str(220) }, required:["type","prompt","hint","display","answers"] },
      }, required:["21","22","23","24","25"] },
      6: { type: "object", properties: {
        "26": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "27": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "28": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "29": { type:"object", properties:{ type:{type:"string",enum:["okuma_sik"]}, prompt:str(), log:str(500), correct:str(220), distractors:strArr(2,2,220) }, required:["type","prompt","log","correct","distractors"] },
        "30": { type:"object", properties:{ type:{type:"string",enum:["final"]}, prompt:str(), title:str(220), desc:str(380) }, required:["type","prompt","title","desc"] },
      }, required:["26","27","28","29","30"] },
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        message: "SuperBrain AI Worker is running.",
        textModel: "Llama 3.3 70B FP8 Fast",
        fallbackTextModel: "Llama 3.1 8B Fast",
        imageModel: "FLUX.2 Klein 4B",
        ocr: "Hybrid OCR: browser + Moondream 3.1",
      });
    }

    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed." }, 405);
    }

    try {
      const body = await request.json();
      const action = body.action || "image";
      const lang = body.lang === "en" ? "en" : "tr";
      const companionName = cleanOneLine(body.companionName || "", 40);

      // ==================================================
      // 1) PARÇALARA AYIR / JIGSAW — DAHA DERİN
      // ==================================================
      if (action === "jigsaw") {
        const text = cleanMultiLine(body.text, 14000);
        if (!text) return json({ success: false, error: "Text is required." }, 400);

        const taskPrompt = lang === "en"
          ? `SOURCE TEXT:\n${text}\n\nCreate a meaningful jigsaw breakdown for a learner.\nFirst understand the text type and internal logic.\nReturn 3 to 5 pieces depending on how much content the text actually contains.\n\nbig_picture:\n- One clear sentence that captures the central meaning, not a vague slogan.\n\nkenar_parcalari:\n- 3-5 distinct pieces.\n- Each piece may use 1-2 short sentences.\n- Include concrete names, actions, causes, effects, quantities or examples when they matter.\n- Narrative: preserve event order and why events matter.\n- Informational/science: preserve concept, mechanism, evidence/example and result.\n- Abstract/literary: preserve the central image, contrast, feeling or argument without flattening it.\n- Do not repeat the same idea in different words.\n\nbuddy_feedback:\n- 1-2 short sentences from the learner's adventure buddy.\n- Refer to ONE specific detail or connection from this exact text.\n- Do not use generic praise.\n- End with a small observation or curiosity prompt when natural.`
          : `KAYNAK METİN:\n${text}\n\nÖğrenci için anlamlı bir yapboz çözümlemesi oluştur.\nÖnce metnin türünü ve kendi içindeki mantığı gerçekten anla.\nMetnin yoğunluğuna göre 3 ile 5 parça arasında seçim yap.\n\nbuyuk_resim:\n- Ana anlamı gerçekten yakalayan tek net cümle olsun; slogan gibi yüzeysel olmasın.\n\nkenar_parcalari:\n- Birbirinden farklı 3-5 parça üret.\n- Her parça gerekirse 1-2 kısa cümle olabilir.\n- Önemliyse kişi, olay, neden, sonuç, miktar ve örnek gibi somut ayrıntıları koru.\n- Hikâyede olay sırasını ve olayların neden önemli olduğunu koru.\n- Bilgilendirici/bilimsel metinde kavramı, nasıl işlediğini, örnek/kanıtı ve sonucu koru.\n- Soyut/edebî metinde temel imgeyi, karşıtlığı, duyguyu veya düşünceyi basitleştirip yok etme.\n- Aynı fikri farklı kelimelerle tekrarlama.\n\nbuddy_feedback:\n- Yol arkadaşının ağzından 1-2 kısa cümle.\n- Bu metinden gerçek ve belirli BİR ayrıntıya ya da bağlantıya değinsin.\n- Genel övgü olmasın.\n- Uygunsa küçük bir gözlem ya da merak sorusuyla bitsin.`;

        const schema = {
          type: "object",
          properties: {
            buyuk_resim: { type: "string" },
            kenar_parcalari: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: { type: "string" },
            },
            buddy_feedback: { type: "string" },
          },
          required: ["buyuk_resim", "kenar_parcalari", "buddy_feedback"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 1050,
          temperature: 0.32,
        });

        return json({
          success: true,
          buyuk_resim: cleanOneLine(data.buyuk_resim, 260),
          kenar_parcalari: (data.kenar_parcalari || [])
            .slice(0, 5)
            .map((x) => cleanOneLine(x, 360)),
          buddy_feedback: cleanOneLine(data.buddy_feedback, 300),
        });
      }

      // ==================================================
      // 2) HAFIZA SARAYI — SADECE SLOGAN DEĞİL, GERÇEK BAĞ
      // ==================================================
      if (action === "palace") {
        const text = cleanMultiLine(body.text, 14000);
        if (!text) return json({ success: false, error: "Text is required." }, 400);

        const taskPrompt = lang === "en"
          ? `SOURCE TEXT:\n${text}\n\nBuild exactly 3 memory-palace cues: living room, kitchen, bookshelf/reading corner.\nFor each room:\n1) choose a different important idea from the source;\n2) turn it into a vivid, unusual but understandable visual event in that room;\n3) make the cue explain what the image helps the learner remember.\n\nEach cue can be TWO short sentences: first the memorable image, then the meaning.\nDo not use random decoration that has no connection to the source.\nDo not reuse the same fact in multiple rooms.\nKeep source-specific names, quantities and relationships when useful.\nChoose one meaningful emoji for each room.\n\nbuddy_feedback: 1-2 specific sentences explaining which room-image connection is especially useful and why, without generic praise.`
          : `KAYNAK METİN:\n${text}\n\nTam 3 hafıza sarayı ipucu kur: oturma odası, mutfak, kitaplık/okuma köşesi.\nHer oda için:\n1) kaynaktan farklı ve önemli bir bilgi seç;\n2) bunu o odada canlı, biraz sıra dışı ama anlaşılır bir görüntüye dönüştür;\n3) ipucunda bu görüntünün hangi bilgiyi hatırlattığını da belli et.\n\nHer ipucu İKİ kısa cümle olabilir: önce akılda kalacak görüntü, sonra neyi hatırlattığı.\nKaynakla ilgisi olmayan rastgele süsler ekleme.\nAynı bilgiyi farklı odalarda tekrar etme.\nGerekiyorsa özel adları, miktarları ve ilişkileri koru.\nHer oda için anlamlı bir emoji seç.\n\nbuddy_feedback: Hangi oda-görüntü bağlantısının özellikle işe yaradığını ve nedenini 1-2 somut cümleyle söyle; genel övgü yapma.`;

        const schema = {
          type: "object",
          properties: {
            room1_icon: { type: "string" },
            room1_cue: { type: "string" },
            room2_icon: { type: "string" },
            room2_cue: { type: "string" },
            room3_icon: { type: "string" },
            room3_cue: { type: "string" },
            buddy_feedback: { type: "string" },
          },
          required: [
            "room1_icon", "room1_cue",
            "room2_icon", "room2_cue",
            "room3_icon", "room3_cue",
            "buddy_feedback"
          ],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 1100,
          temperature: 0.42,
        });

        return json({
          success: true,
          room1_icon: cleanOneLine(data.room1_icon, 8) || "🛋️",
          room1_cue: cleanOneLine(data.room1_cue, 420),
          room2_icon: cleanOneLine(data.room2_icon, 8) || "🍳",
          room2_cue: cleanOneLine(data.room2_cue, 420),
          room3_icon: cleanOneLine(data.room3_icon, 8) || "📚",
          room3_cue: cleanOneLine(data.room3_cue, 420),
          buddy_feedback: cleanOneLine(data.buddy_feedback, 320),
        });
      }

      // ==================================================
      // 3) TEKERLEME — KELİMENİN ANLAMIYLA BAĞ KUR
      // ==================================================
      if (action === "mnemonic") {
        const word = cleanOneLine(body.word, 100);
        const sourceText = cleanMultiLine(body.sourceText || "", 5000);
        if (!word) return json({ success: false, error: "Word is required." }, 400);

        const taskPrompt = lang === "en"
          ? `TARGET WORD: ${word}\n${sourceText ? `SOURCE CONTEXT:\n${sourceText}\n` : ""}\nCreate exactly 2 short rhyming lines for a child.\nThe rhyme must help remember the word, not just rhyme randomly.\nIf source context reveals the meaning or role of the word, connect the rhyme to that meaning.\nUse the target word naturally.\nKeep rhythm easy to say aloud.\nAvoid nonsense filler.\n\nbuddy_feedback: one brief, specific memory tip about the word or rhyme. Do not use generic praise.`
          : `HEDEF KELİME: ${word}\n${sourceText ? `KAYNAK BAĞLAM:\n${sourceText}\n` : ""}\nÇocuk için tam 2 kısa kafiyeli satır oluştur.\nKafiye yalnızca ses benzerliği için değil, kelimeyi hatırlatmak için işe yarasın.\nKaynak bağlam kelimenin anlamını ya da görevini gösteriyorsa tekerlemeyi o anlamla bağla.\nHedef kelimeyi doğal biçimde kullan.\nYüksek sesle kolay söylenecek bir ritim kur.\nAnlamsız dolgu kullanma.\n\nbuddy_feedback: Kelimeyi veya tekerlemeyi hatırlamaya yarayan tek kısa ve somut ipucu ver. Genel övgü kullanma.`;

        const schema = {
          type: "object",
          properties: {
            lines: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" },
            },
            buddy_feedback: { type: "string" },
          },
          required: ["lines", "buddy_feedback"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 500,
          temperature: 0.58,
          frequencyPenalty: 0.5,
          presencePenalty: 0.2,
        });

        return json({
          success: true,
          lines: (data.lines || []).slice(0, 2).map((x) => cleanOneLine(x, 180)),
          buddy_feedback: cleanOneLine(data.buddy_feedback, 260),
        });
      }

      // ==================================================
      // 4) ZİHİN AĞACI — 3 KELİMELİK ÖZET DEĞİL
      // ==================================================
      if (action === "mindmap") {
        const text = cleanMultiLine(body.text, 14000);
        if (!text) return json({ success: false, error: "Text is required." }, 400);

        const taskPrompt = lang === "en"
          ? `SOURCE TEXT:\n${text}\n\nCreate a useful mind map, not a shallow summary.\nroot: 2-7 words naming the real central concept.\nbranches: choose 4-6 distinct branches according to the source.\nEach branch may be 1-2 short sentences and should capture ONE relationship, mechanism, event, cause, contrast, example or consequence.\nUse concrete source details.\nDo not make all branches synonyms of the root.\nDo not repeat the same fact.\nIf the source is very short, 4 branches are enough; if it is rich, use up to 6.\n\nbuddy_feedback: 1-2 source-specific sentences pointing out a meaningful connection between two branches.`
          : `KAYNAK METİN:\n${text}\n\nYüzeysel bir özet değil, işe yarayan bir zihin ağacı oluştur.\nroot: Gerçek merkez kavramı 2-7 kelimeyle adlandır.\nbranches: Metnin yapısına göre 4-6 farklı dal seç.\nHer dal gerekirse 1-2 kısa cümle olabilir ve yalnızca BİR ilişkiyi, mekanizmayı, olayı, nedeni, karşıtlığı, örneği veya sonucu taşısın.\nKaynak metindeki somut ayrıntıları kullan.\nBütün dalları merkez fikrin eş anlamlısı yapma.\nAynı bilgiyi tekrar etme.\nMetin çok kısaysa 4 dal yeterli; zenginse 6 dala kadar çık.\n\nbuddy_feedback: İki dal arasındaki anlamlı bir bağlantıyı 1-2 somut cümleyle fark ettir.`;

        const schema = {
          type: "object",
          properties: {
            root: { type: "string" },
            branches: {
              type: "array",
              minItems: 4,
              maxItems: 6,
              items: { type: "string" },
            },
            buddy_feedback: { type: "string" },
          },
          required: ["root", "branches", "buddy_feedback"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 1200,
          temperature: 0.32,
        });

        return json({
          success: true,
          root: cleanOneLine(data.root, 120),
          branches: (data.branches || []).slice(0, 6).map((x) => cleanOneLine(x, 360)),
          buddy_feedback: cleanOneLine(data.buddy_feedback, 320),
        });
      }

      // ==================================================
      // 5) GÖREV DİLİMLERİ — GERÇEKÇİ ZAMAN VE MİKTAR
      // ==================================================
      if (action === "chunks") {
        const task = cleanMultiLine(body.task, 2500);
        if (!task) return json({ success: false, error: "Task is required." }, 400);

        const taskPrompt = lang === "en"
          ? `TASK:\n${task}\n\nAnalyze what the task actually requires before splitting it.\nCreate 3-6 startable steps.\nEvery step MUST begin with a realistic time RANGE, for example: "8-12 min — ..."\n\nTIME RULES:\n- Be conservative rather than unrealistically fast.\n- Account for reading, writing, setup, solving, checking and transitions when they are part of the task.\n- Explicit quantities MUST be respected. If the task says 10 questions, all 10 must be allocated across the steps.\n- "Write and solve 10 questions" cannot be a one-minute step; writing, solving and checking each need plausible time.\n- If difficulty is unknown, use a reasonable range rather than fake precision.\n- Do not split merely to reach a fixed number of steps; split at natural stopping points.\n\nEach step should say exactly WHAT to do and HOW MUCH to do.\nReturn total_estimate as a realistic overall time range.\n\nbuddy_feedback: 1-2 practical sentences explaining the easiest first move or why the plan is manageable. Avoid generic praise.`
          : `GÖREV:\n${task}\n\nGörevi parçalamadan önce gerçekten ne gerektirdiğini analiz et.\n3-6 başlanabilir adım oluştur.\nHer adım mutlaka gerçekçi bir ZAMAN ARALIĞI ile başlasın. Örnek: "8-12 dk — ..."\n\nZAMAN KURALLARI:\n- Aşırı iyimser değil, biraz temkinli süreler ver.\n- Görevde varsa okuma, yazma, hazırlık, çözme, kontrol ve geçiş sürelerini hesaba kat.\n- Açık miktarları mutlaka koru. Görev 10 soru diyorsa 10 sorunun tamamı adımlara dağılmalı.\n- "10 soru yaz ve çöz" gibi bir görev 1 dakikalık olamaz; yazma, çözme ve kontrol için makul süre gerekir.\n- Zorluk bilinmiyorsa sahte kesinlik yerine gerçekçi bir aralık kullan.\n- Sırf belirli sayıda adım olsun diye yapay biçimde bölme; doğal duraklarda böl.\n\nHer adım tam olarak NE yapılacağını ve NE KADAR yapılacağını söylesin.\ntotal_estimate alanında toplam gerçekçi süre aralığını ver.\n\nbuddy_feedback: İlk başlamayı kolaylaştıracak somut bir hareketi veya bu planın neden yönetilebilir olduğunu 1-2 pratik cümleyle söyle. Genel övgü yapma.`;

        const schema = {
          type: "object",
          properties: {
            total_estimate: { type: "string" },
            chunks: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: { type: "string" },
            },
            buddy_feedback: { type: "string" },
          },
          required: ["total_estimate", "chunks", "buddy_feedback"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 1150,
          temperature: 0.26,
        });

        return json({
          success: true,
          total_estimate: cleanOneLine(data.total_estimate, 120),
          chunks: (data.chunks || []).slice(0, 6).map((x) => cleanOneLine(x, 360)),
          buddy_feedback: cleanOneLine(data.buddy_feedback, 320),
        });
      }

      // ==================================================
      // 6) HENÜZ / GROWTH — KİŞİYE ÖZEL, BOŞ MOTİVASYON DEĞİL
      // ==================================================
      if (action === "growth") {
        const goal = cleanMultiLine(body.goal, 1200);
        if (!goal) return json({ success: false, error: "Goal is required." }, 400);

        const taskPrompt = lang === "en"
          ? `LEARNER'S STATEMENT OR GOAL:\n${goal}\n\nRewrite it into 1-2 short growth-mindset sentences.\nKeep the exact difficulty recognizable.\nSentence 1: realistic reframe — a skill can improve through a specific kind of practice.\nSentence 2, when useful: one tiny next action the learner can actually do.\nAvoid empty slogans, exaggerated praise, theory and generic lines that could fit any goal.\nThe interface adds the word YET separately, so do not force YET into the response.\n\nbuddy_feedback: one short, non-repetitive line from the companion that refers to this exact goal.`
          : `ÖĞRENCİNİN CÜMLESİ VEYA HEDEFİ:\n${goal}\n\nBunu 1-2 kısa gelişim zihniyeti cümlesine dönüştür.\nZorlanılan şey aynen tanınabilir kalsın.\n1. cümle: Bu becerinin hangi tür çalışmayla gelişebileceğini gerçekçi biçimde yeniden çerçevele.\nGerekirse 2. cümle: Öğrencinin hemen yapabileceği minicik ve somut bir sonraki hareket ver.\nBoş slogan, abartılı övgü, teori ve her hedefe uyabilecek genel cümlelerden kaçın.\nArayüz HENÜZ kelimesini ayrıca ekleyecek; yanıta zorla ekleme.\n\nbuddy_feedback: Bu özel hedefe değinen, tekrarsız tek kısa yol arkadaşı cümlesi.`;

        const schema = {
          type: "object",
          properties: {
            text: { type: "string" },
            buddy_feedback: { type: "string" },
          },
          required: ["text", "buddy_feedback"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 520,
          temperature: 0.44,
          frequencyPenalty: 0.5,
        });

        return json({
          success: true,
          text: cleanOneLine(data.text, 360),
          buddy_feedback: cleanOneLine(data.buddy_feedback, 260),
        });
      }

      // ==================================================
      // 7) SOHBET — GERÇEK BAĞLAMSAL YOL ARKADAŞI
      // ==================================================
      if (action === "chat") {
        const sourceText = cleanMultiLine(body.sourceText || "", 10000);
        const message = cleanMultiLine(body.message || "", 1600);
        const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
        if (!message) return json({ success: false, error: "Message is required." }, 400);

        const historyText = history
          .map((item) => `${item.role === "assistant" ? "BUDDY" : "LEARNER"}: ${cleanOneLine(item.content, 500)}`)
          .join("\n");

        const taskPrompt = lang === "en"
          ? `ADVENTURE BUDDY NAME: ${companionName || "Buddy"}\nSOURCE TEXT:\n${sourceText || "No source text is currently available."}\n\nRECENT CONVERSATION:\n${historyText || "No previous messages."}\n\nNEW LEARNER MESSAGE:\n${message}\n\nReply as the learner's adventure buddy.\n- Respond to what the learner ACTUALLY said.\n- If they answer a reflection question, mention one specific idea from their message, add one useful source-grounded connection, then ask one fresh question when natural.\n- If they ask a question, answer it first.\n- If the source does not contain the answer, say that briefly instead of inventing it.\n- Use 2-4 short sentences.\n- Do not give generic praise as the whole response.\n- Do not repeat openings or sentences already used in RECENT CONVERSATION.\n- Vary wording and questions.\n- Keep it warm, curious and substantive.`
          : `MACERA ARKADAŞININ ADI: ${companionName || "Yol Arkadaşı"}\nKAYNAK METİN:\n${sourceText || "Şu anda kaynak metin yok."}\n\nSON SOHBET:\n${historyText || "Önceki mesaj yok."}\n\nÖĞRENCİNİN YENİ MESAJI:\n${message}\n\nÖğrencinin yol arkadaşı olarak cevap ver.\n- Öğrencinin GERÇEKTEN söylediği şeye karşılık ver.\n- Bir düşünme sorusuna yanıt verdiyse, mesajındaki bir somut fikri belirt; kaynak metinden işe yarayan bir bağlantı ekle; uygunsa yeni ve farklı tek bir soru sor.\n- Soru sorduysa önce sorusuna cevap ver.\n- Cevap kaynakta yoksa uydurmak yerine bunu kısaca söyle.\n- 2-4 kısa cümle kullan.\n- Yanıtın tamamını genel övgüye çevirme.\n- SON SOHBETTE kullanılan açılışları ve cümleleri tekrar etme.\n- Kelimeleri ve soruları çeşitlendir.\n- Sıcak, meraklı ve içerikli ol.`;

        const schema = {
          type: "object",
          properties: { reply: { type: "string" } },
          required: ["reply"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 650,
          temperature: 0.6,
          frequencyPenalty: 0.7,
          presencePenalty: 0.3,
          repetitionPenalty: 1.12,
        });

        return json({ success: true, reply: cleanOneLine(data.reply, 650) });
      }

      // ==================================================
      // 8) YOL ARKADAŞINA DOKUNUNCA — BAĞLAMA ÖZEL
      // ==================================================
      if (action === "buddy") {
        const sourceText = cleanMultiLine(body.sourceText || "", 7000);
        const moduleName = cleanOneLine(body.moduleName || "", 60);
        const previous = cleanOneLine(body.previous || "", 400);

        const taskPrompt = lang === "en"
          ? `The learner tapped their adventure buddy.\nCurrent module: ${moduleName || "unknown"}.\nSource text:\n${sourceText || "No source text yet."}\nPrevious buddy message to avoid repeating:\n${previous || "none"}\n\nWrite 1-2 short, useful sentences. If there is source text, refer to one concrete detail or suggest one next move. If there is no text, give a practical invitation to start. Do not repeat the previous message. Avoid generic superpower slogans.`
          : `Öğrenci yol arkadaşına dokundu.\nŞu anki bölüm: ${moduleName || "bilinmiyor"}.\nKaynak metin:\n${sourceText || "Henüz kaynak metin yok."}\nTekrar edilmemesi gereken önceki yol arkadaşı mesajı:\n${previous || "yok"}\n\n1-2 kısa ve işe yarayan cümle yaz. Kaynak metin varsa gerçek bir ayrıntıya değin veya tek somut sonraki adım öner. Metin yoksa başlamayı kolaylaştıran pratik bir davet ver. Önceki mesajı tekrar etme. Genel süper güç sloganlarından kaçın.`;

        const schema = {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 350,
          temperature: 0.62,
          frequencyPenalty: 0.75,
          presencePenalty: 0.25,
        });

        return json({ success: true, text: cleanOneLine(data.text, 360) });
      }

      // ==================================================
      // 9) BEYİN KASI — HATAYA ÖZEL GERİ BİLDİRİM
      // ==================================================
      if (action === "mistake_feedback") {
        const item = cleanMultiLine(body.item || "", 800);
        if (!item) return json({ success: false, error: "Item is required." }, 400);

        const taskPrompt = lang === "en"
          ? `LEARNER'S DIFFICULT ITEM:\n${item}\n\nGive 2-3 short sentences of useful feedback.\n1) Name the difficulty without shame or exaggerated praise.\n2) Give one specific practice strategy that fits this exact item when possible.\n3) End with one tiny repeatable action.\nDo not claim the brain changed instantly. Do not use generic motivational filler.`
          : `ÖĞRENCİNİN ZORLANDIĞI ŞEY:\n${item}\n\n2-3 kısa ve işe yarayan geri bildirim ver.\n1) Zorluğu utandırmadan ve abartılı övgü yapmadan adlandır.\n2) Mümkünse tam bu şeye uygun tek somut çalışma stratejisi ver.\n3) Tekrarlanabilir minicik bir hareketle bitir.\nBeynin anında değiştiğini iddia etme. Genel motivasyon dolgusundan kaçın.`;

        const schema = {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        };

        const data = await runStructuredText({
          lang,
          taskPrompt,
          schema,
          maxTokens: 450,
          temperature: 0.42,
        });

        return json({ success: true, text: cleanOneLine(data.text, 500) });
      }

      // ==================================================
      // DEEP SEA LAB — COHERENT LESSON BLUEPRINT
      // ==================================================
      if (action === "mission_plan") {
        const sourceText = cleanMultiLine(body.sourceText, 30000);

        if (!sourceText) {
          return json(
            { success: false, error: "Mission source text is required." },
            400
          );
        }

        const planSchema = {
          type: "object",
          properties: {
            lessonTitle: str(180),
            estimatedLevel: str(80),
            learnerProfile: str(220),
            primaryGoal: str(420),
            grammarTargets: strArr(0, 8, 160),
            vocabularyTargets: strArr(0, 24, 100),
            communicativeGoals: strArr(0, 8, 180),
            sourceFactsToPreserve: strArr(0, 16, 220),
            progression: {
              type: "array",
              minItems: 6,
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  module: { type: "integer", minimum: 1, maximum: 6 },
                  objective: str(260),
                  contentFocus: str(320),
                },
                required: ["module", "objective", "contentFocus"],
              },
            },
          },
          required: [
            "lessonTitle",
            "estimatedLevel",
            "learnerProfile",
            "primaryGoal",
            "grammarTargets",
            "vocabularyTargets",
            "communicativeGoals",
            "sourceFactsToPreserve",
            "progression",
          ],
        };

        const taskPrompt = `
Analyze the teacher source and build ONE coherent lesson blueprint BEFORE any game stations are written.

TEACHER SOURCE:
${sourceText}

INSTRUCTIONS:
- Identify what the lesson is truly teaching.
- Separate lesson content from game-theme language.
- Infer a likely CEFR level only if the teacher did not state one.
- If the prompt is sparse, responsibly infer ordinary classroom examples compatible with the explicit topic.
- Choose vocabulary and grammar that belong together.
- Create a 6-module progression from recognition to production and transfer.
- Modules 1-5 are practice stages; module 6 should synthesize/apply learning.
- Preserve concrete facts from uploaded documents when they matter.
- Do not fill the plan with submarine vocabulary unless the source actually teaches it.
        `.trim();

        try {
          const plan = await runMissionStructuredText({
            taskPrompt,
            schema: planSchema,
            maxTokens: 2200,
          });

          return json({
            success: true,
            plan,
          });

        } catch (aiError) {
          return json(
            {
              success: false,
              where: "mission_plan",
              error: safeErrorText(aiError),
            },
            500
          );
        }
      }

      // ==================================================
      // DEEP SEA LAB — 5 STATION MODULE GENERATOR
      // ==================================================
      if (action === "mission_module") {
        const sourceText = cleanMultiLine(body.sourceText, 30000);
        const moduleNo = Number(body.module);
        const visualMode = body.visualMode === true;
        const lessonPlan =
          body.plan && typeof body.plan === "object"
            ? body.plan
            : {};

        if (!sourceText) return json({ success:false, error:"Mission source text is required." }, 400);
        if (![1,2,3,4,5,6].includes(moduleNo)) return json({ success:false, error:"Module must be between 1 and 6." }, 400);

        const moduleNotes = {
          1: `MODULE 1 — Recognition & Meaning, stations 1-5.
IMPORTANT: fener/kablo/vana/kargo/mikroskop are interaction mechanics, NOT vocabulary topics.
1 fener: learner locates the correct TARGET LANGUAGE item among exactly 2 plausible decoys.
2 kablo: learner matches one lesson item to its meaning, category, collocation, example, or function; exactly 2 distractors.
3 vana: learner selects one of exactly 3 lesson-relevant choices; targetVal MUST equal choices[1] because the middle valve position is correct.
4 kargo: learner classifies or routes a lesson item to the correct meaning/category/use; exactly 2 distractors.
5 mikroskop: learner identifies a meaning, form, category, collocation, or concept from the lesson; exactly 2 distractors.
Do NOT ask what flashlight/cable/valve/cargo/microscope means unless those words are explicitly in the teacher's syllabus.`,
          2: `MODULE 2 — Syntax & Structure, stations 6-10.
6 boru: sentence must be stored as comma-separated WORD/CHUNK sequence in correct order, e.g. "She,is,reading,a,book". Do not add commas inside a chunk.
7 radyo: choose an integer targetFreq from 82-138. The prompt must connect tuning the frequency to a genuine grammar/structure clue from the source.
8 periskop: correctErr is the grammatically flawed sentence; normals are exactly 2 correct sentences.
9 terazi: subject + correct verb + one incorrect distractor for agreement/auxiliary/tense matching.
10 mors: a short incomplete language form with one correct piece and exactly 2 distractors.
Use the teacher's actual target grammar and vary the task.`,
          3: `MODULE 3 — Acoustic Signals, stations 11-15.
No AI audio file is generated. Create strong transcript/instruction material that the teacher can later record or replace.
11-14 ses_sik: short trans transcript, one correct answer and exactly 2 distractors. Vary listening purpose where supported by source.
15 salter: trans contains a clear 3-step sequence. order is exactly three short comma-separated labels in the same correct order.`,
          4: `MODULE 4 — Deep Sea Reading, stations 16-20.
16 uv: source-grounded reading clue/text + one inference/comprehension answer + exactly 2 distractors.
17-19 okuma_sik: concise passages, one correct answer and exactly 2 distractors. Use different comprehension skills where possible.
20 tablo: tableHtml is plain readable telemetry/table TEXT, not actual HTML markup. One correct answer + exactly 2 distractors.
Preserve meaningful details from the source.`,
          5: `MODULE 5 — Productive Writing, stations 21-25.
All are yazma stations with prompt, hint, display and answers.
answers is a comma-separated list of accepted answers.
When the task allows more than one genuinely correct form, include 2-5 reasonable accepted variants.
For example, if "I played soccer with friends" is correct and "I played soccer" also fully satisfies the question, include BOTH.
Do not list semantically different answers merely to be lenient.
Vary the productive task: recall, completion, transformation, correction, short response, or sentence building.
Keep required typing suitable for a single-line input and the learner's level.`,
          6: `MODULE 6 — Emergency Protocol + Final, stations 26-30.
26-29 okuma_sik: short decision/comprehension scenarios grounded in the source with one correct answer + exactly 2 distractors each.
Do not repeat stations 17-20; use synthesis, transfer, contrast or application.
30 final: celebratory final station reflecting THIS generated lesson without inventing achievements.`,
        };

        const visualsInstruction = visualMode
          ? `SMART VISUAL MODE IS ON.
Return 0-3 visual suggestions for this module.
Only suggest an image if it materially improves understanding, memory, classification, reading context or concrete vocabulary.
Do not suggest an image just because images are allowed.
Avoid visuals for purely grammatical items unless a concrete scene genuinely supports meaning.
Each visual prompt must be source-grounded, describe the exact educational scene in English, and contain NO visible text, labels, letters, numbers, captions, signs, speech bubbles or worksheets.
Set priority 1-5.`
          : `TEXT-ONLY MODE IS ON. Return an empty visuals array.`;

        const taskPrompt = `TEACHER SOURCE:\n${sourceText}\n\nSHARED LESSON BLUEPRINT:\n${JSON.stringify(lessonPlan)}\n\nCREATE:\n${moduleNotes[moduleNo]}\n\nGENERAL REQUIREMENTS:\n- Produce exactly the five required stations.\n- Use the shared blueprint so all 30 stations feel like ONE lesson, not six unrelated generations.\n- Treat station names/mechanics as interaction shells only.\n- Preserve fixed station types exactly.\n- Use the source deeply enough that output feels custom, not generic.\n- Follow the module objective from the blueprint.\n- Do not recycle the same vocabulary/answer without a reason.\n- Keep prompts playable and student-facing.\n- If the source is sparse, use ordinary examples compatible with its explicit topic/level instead of default submarine vocabulary.\n- Deep-sea language may frame the activity, but the English target must come from the lesson.\n\n${visualsInstruction}`;

        const schema = {
          type: "object",
          properties: { stations: stationSchemas[moduleNo], visuals: visualSchema },
          required: ["stations", "visuals"],
        };

        try {
          const result = await runMissionStructuredText({ taskPrompt, schema, maxTokens: (moduleNo === 4 || moduleNo === 6) ? 3000 : 2500 });
          const stations = result?.stations && typeof result.stations === "object" ? result.stations : {};
          const visuals = Array.isArray(result?.visuals) ? result.visuals.slice(0,3).map(v => ({
            stationId: Number(v.stationId),
            prompt: cleanMultiLine(v.prompt, 1000),
            reason: cleanOneLine(v.reason, 260),
            priority: Math.max(1, Math.min(5, Number(v.priority) || 1)),
          })) : [];
          return json({ success:true, module:moduleNo, stations, visuals: visualMode ? visuals : [] });
        } catch (aiError) {
          return json({ success:false, where:"mission_module", module:moduleNo, error:safeErrorText(aiError) }, 500);
        }
      }

      // ==================================================
      // DEEP SEA LAB — TEXT TO SPEECH
      // Real MP3 audio for listening stations
      // ==================================================
      if (action === "tts") {
        const text = cleanOneLine(body.text, 700);

        if (!text) {
          return json(
            { success: false, error: "Text is required for TTS." },
            400
          );
        }

        try {
          const rawResponse = await env.AI.run(
            "@cf/deepgram/aura-2-en",
            {
              text,
              speaker: "luna",
              encoding: "mp3",
              bit_rate: 32000,
            },
            {
              returnRawResponse: true,
            }
          );

          const buffer = await rawResponse.arrayBuffer();
          const bytes = new Uint8Array(buffer);

          let binary = "";
          const chunk = 0x8000;

          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(
              ...bytes.subarray(i, i + chunk)
            );
          }

          const base64 = btoa(binary);

          return json({
            success: true,
            audio: `data:audio/mpeg;base64,${base64}`,
            model: "aura-2-en",
          });

        } catch (aiError) {
          return json(
            {
              success: false,
              where: "tts",
              error: safeErrorText(aiError),
            },
            500
          );
        }
      }

      // ==================================================
      // 10) HİBRİT OCR İÇİN VISION FALLBACK
      //     Fotoğraftaki basılı metni Moondream 3.1 ile çıkarır.
      // ==================================================
      if (action === "ocr") {
        const image =
          typeof body.image === "string"
            ? body.image.trim()
            : "";

        if (!image || !image.startsWith("data:image/")) {
          return json(
            {
              success: false,
              error: "A base64 image data URL is required.",
            },
            400
          );
        }

        const question =
          lang === "en"
            ? `Transcribe ALL readable printed text from the MAIN page in this image as accurately as possible.
Return only the transcription.
Preserve paragraph breaks and punctuation when visible.
Do not summarize.
Do not explain.
Do not add headings or commentary.
Ignore hands, table/background, and a neighboring page unless its text clearly belongs to the main page.
If a word is genuinely unreadable, use [unclear] instead of inventing it.`
            : `Bu görseldeki ANA sayfada bulunan okunabilir basılı metnin TAMAMINI mümkün olduğunca doğru biçimde aktar.
Yalnızca metnin transkripsiyonunu döndür.
Görülebiliyorsa paragraf ayrımlarını ve noktalama işaretlerini koru.
Özetleme yapma.
Açıklama ekleme.
Başlık veya yorum uydurma.
El, masa/arka plan ve yan sayfadaki metni ana sayfaya ait değilse görmezden gel.
Gerçekten okunamayan bir kelime varsa uydurmak yerine [okunamadı] yaz.`;

        try {
          const result =
            await env.AI.run(
              "@cf/moondream/moondream3.1-9B-A2B",
              {
                task: "query",
                image,
                question,
                reasoning: false,
                temperature: 0,
                top_p: 0.9,
                max_tokens: 6000,
              }
            );

          const rawText =
            result?.answer ??
            result?.response ??
            result?.caption ??
            "";

          const text =
            cleanMultiLine(
              String(rawText)
                .replace(/```text/gi, "")
                .replace(/```/g, "")
                .replace(
                  /^(transcription|transcript|metin|transkripsiyon)\s*:\s*/i,
                  ""
                ),
              18000
            );

          if (!text) {
            return json(
              {
                success: false,
                where: "vision_ocr",
                error: "Vision model returned no readable text.",
              },
              500
            );
          }

          return json({
            success: true,
            text,
            model: "moondream3.1-9B-A2B",
          });

        } catch (aiError) {
          return json(
            {
              success: false,
              where: "vision_ocr",
              error: safeErrorText(aiError),
            },
            500
          );
        }
      }

      // ==================================================
      // 11) METNİ ANALİZ ET VE 2 GÖRSEL PLANLA
      //     Bu bölüm özellikle mevcut başarılı davranışı koruyor.
      // ==================================================
      if (action === "scenes") {
        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (!text) return json({ success: false, error: "Text is required." }, 400);

        const captionLanguage = lang === "en" ? "English" : "Turkish";

        const systemPrompt = `
You are the visual-planning engine of a general educational dual-coding tool.
The source can be ANY type of educational or literary text.
Your job is to create TWO visuals that help a learner understand and remember the EXACT source text.
Do not create generic attractive pictures.

Choose two educational visuals according to text type.
Narrative: two specific important events.
Informational/science: main concept, then mechanism/effect/example.
Process: two chronological stages.
Cause-effect: cause then effect.
Historical/biographical: two grounded moments or event + consequence.
Comparison: visually distinct sides.
Descriptive: two important concrete aspects.
Abstract: literal imagery when possible; otherwise a simple symbolic metaphor.

STRICT SOURCE FIDELITY:
- Preserve identities, species, object types, roles, descriptions, actions and relationships.
- Convert proper names into visible descriptions.
- Repeat important visual characteristics across scenes when the same entity returns.
- Do not add unrelated humans, animals, objects or scenery.

Every scene must include caption, scene_mode, scene_goal, must_include, must_avoid and image_prompt.
scene_mode is literal or symbolic.
must_include: 2-8 mandatory visual facts.
must_avoid: 2-8 inaccuracies or irrelevant additions.
image_prompt is ALWAYS English.
caption is in ${captionLanguage}.
No visible text, labels, titles, speech bubbles, logos or watermarks inside the generated image.
        `.trim();

        const userPrompt = `SOURCE TEXT:\n${text}\n\nCreate the two most educationally useful and source-faithful visuals for this exact text.`;

        let response;
        try {
          response = await env.AI.run(SCENE_MODEL, {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 1200,
            response_format: {
              type: "json_schema",
              json_schema: {
                type: "object",
                properties: {
                  text_type: { type: "string" },
                  scenes: {
                    type: "array",
                    minItems: 2,
                    maxItems: 2,
                    items: {
                      type: "object",
                      properties: {
                        caption: { type: "string" },
                        scene_mode: { type: "string" },
                        scene_goal: { type: "string" },
                        must_include: { type: "array", items: { type: "string" } },
                        must_avoid: { type: "array", items: { type: "string" } },
                        image_prompt: { type: "string" },
                      },
                      required: [
                        "caption", "scene_mode", "scene_goal",
                        "must_include", "must_avoid", "image_prompt"
                      ],
                    },
                  },
                },
                required: ["text_type", "scenes"],
              },
            },
          });
        } catch (aiError) {
          return json({
            success: false,
            where: "scene_generation",
            error: safeErrorText(aiError),
          }, 500);
        }

        const sceneData = parseAIJson(extractModelPayload(response));
        if (!sceneData || !Array.isArray(sceneData.scenes) || sceneData.scenes.length !== 2) {
          return json({
            success: false,
            where: "scene_generation",
            error: "The text model did not return exactly two scenes.",
          }, 500);
        }

        const scenes = sceneData.scenes.map((scene) => {
          const caption = cleanOneLine(scene.caption, 140);
          const mode = scene.scene_mode === "symbolic" ? "symbolic" : "literal";
          const goal = cleanOneLine(scene.scene_goal, 220);
          const mustInclude = Array.isArray(scene.must_include)
            ? scene.must_include.map((x) => cleanOneLine(x, 160)).filter(Boolean).slice(0, 8)
            : [];
          const mustAvoid = Array.isArray(scene.must_avoid)
            ? scene.must_avoid.map((x) => cleanOneLine(x, 160)).filter(Boolean).slice(0, 8)
            : [];
          const basePrompt = cleanOneLine(scene.image_prompt, 950);

          const structuredPrompt = [
            `SCENE MODE: ${mode}.`,
            goal ? `LEARNING GOAL: ${goal}.` : "",
            mustInclude.length
              ? `MANDATORY ELEMENTS — EVERY ONE MUST BE VISIBLE: ${mustInclude.join("; ")}.`
              : "",
            mustAvoid.length ? `DO NOT SHOW: ${mustAvoid.join("; ")}.` : "",
            `EXACT VISUAL SCENE: ${basePrompt}`,
          ].filter(Boolean).join(" ").slice(0, 1500);

          return { caption, image_prompt: structuredPrompt };
        });

        return json({
          success: true,
          text_type: sceneData.text_type || "mixed",
          scenes,
        });
      }

      // ==================================================
      // 12) FLUX.2 KLEIN 4B İLE GÖRSEL ÜRET
      // ==================================================
      if (action === "image") {
        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
        if (!prompt) return json({ success: false, error: "Prompt is required." }, 400);

        const compactPrompt = prompt.replace(/\s+/g, " ").trim().slice(0, 1550);
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
          form.append("prompt", finalPrompt);
          form.append("guidance", "4");
          form.append("width", "512");
          form.append("height", "512");

          const formResponse = new Response(form);
          const result = await env.AI.run(
            "@cf/black-forest-labs/flux-2-klein-4b",
            {
              multipart: {
                body: formResponse.body,
                contentType: formResponse.headers.get("content-type"),
              },
            }
          );

          if (!result || !result.image) {
            return json({
              success: false,
              where: "image_generation",
              error: "FLUX.2 returned no image.",
            }, 500);
          }

          return json({
            success: true,
            image: `data:image/jpeg;charset=utf-8;base64,${result.image}`,
          });
        } catch (aiError) {
          return json({
            success: false,
            where: "image_generation",
            error: safeErrorText(aiError),
          }, 500);
        }
      }

      return json({ success: false, error: "Unknown action." }, 400);
    } catch (error) {
      return json({ success: false, error: safeErrorText(error) }, 500);
    }
  },
};
