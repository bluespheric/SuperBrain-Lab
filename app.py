import gradio as gr
from PIL import Image
import pytesseract
import tempfile
import math
import asyncio
import edge_tts

# Doğal Yapay Zeka Seslendiricisi (Edge-TTS: TR & EN)
async def generate_natural_voice(text, lang_choice):
    if not text.strip():
        return None
    
    # Doğal ses modelleri
    voice = "tr-TR-AhmetNeural" if lang_choice == "Türkçe (TR)" else "en-US-AnaNeural"
    communicate = edge_tts.Communicate(text, voice)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
        await communicate.save(fp.name)
        return fp.name

def text_to_speech_sync(text, lang_choice):
    return asyncio.run(generate_natural_voice(text, lang_choice))

# Biyonik Okuma Dönüştürücüsü
def bionic_word_magic(text, intensity):
    if not text.strip():
        return ""
    words = text.split()
    sonuc = []
    factor = intensity / 100.0
    for w in words:
        if len(w) <= 2:
            sonuc.append(f"<b style='color:#6C5CE7;'>{w}</b>")
        else:
            mid = math.ceil(len(w) * factor)
            sonuc.append(f"<b style='color:#6C5CE7;'>{w[:mid]}</b>{w[mid:]}")
    
    return f"""
    <div style='background-color:#FEF9E7; padding:24px; border-radius:18px; 
                font-size:22px; line-height:2.3; border:3px dashed #6C5CE7; color:#2D3748;'>
        {' '.join(sonuc)}
    </div>
    """

# Görselden Metin Okuma (OCR)
def ocr_read(image):
    if image is None:
        return ""
    return pytesseract.image_to_string(image, lang="tur+eng")

# Çocuk Odaklı Stil & Arayüz
custom_css = """
body { font-family: 'Comic Sans MS', sans-serif; }
.gradio-container { background-color: #F8F9FA !important; }
"""

with gr.Blocks(css=custom_css, theme=gr.themes.Soft()) as demo:
    gr.HTML("""
        <div style='background:linear-gradient(135deg, #6C5CE7, #a29bfe); padding:20px; 
                    border-radius:20px; text-align:center; color:white;'>
            <h1 style='margin:0;'>🧪 Süper Beyin Laboratuvarı 🚀</h1>
            <p style='margin:5px 0 0 0; font-size:18px;'>Kelimelerin Gücünü Keşfet, Doğal Sesle Dinle!</p>
        </div>
    """)
    
    with gr.Tabs():
        with gr.TabItem("✨ Metin Yaz & Oku"):
            yazi_girisi = gr.Textbox(
                label="Okumak istediğin hikaye ya da metin:",
                value="Bir zamanlar meraklı bir kâşif varmış. Bu kâşif Süper Beyin Laboratuvarında yepyeni dünyalar keşfetmeye bayılırmış.",
                lines=3
            )
            yogunluk = gr.Slider(20, 80, value=50, step=10, label="⚡ Süper Odak Gücü (% Biyonik)")
            cevir_btn = gr.Button("🚀 Sihirli Yazıya Çevir", variant="primary")
            
        with gr.TabItem("📸 Kitap Fotoğrafı Yükle"):
            resim_girisi = gr.Image(type="pil", label="Kitabın fotoğrafını seç")
            ocr_btn = gr.Button("🔍 Fotoğraftaki Harfleri Topla", variant="secondary")
    
    gr.HTML("<h3 style='color:#6C5CE7;'>👓 Süper Odak Okuma Masası:</h3>")
    cikti_alani = gr.HTML()
    
    with gr.Row():
        dil_secimi = gr.Radio(["Türkçe (TR)", "English (EN)"], value="Türkçe (TR)", label="🗣️ Seslendirme Dili")
        ses_btn = gr.Button("🔊 Doğal Sesle Dinle")
        ses_cikti = gr.Audio(label="Dinleme Alanı", interactive=False)
        
    # Etkileşimler
    cevir_btn.click(bionic_word_magic, inputs=[yazi_girisi, yogunluk], outputs=cikti_alani)
    ocr_btn.click(ocr_read, inputs=resim_girisi, outputs=yazi_girisi)
    ses_btn.click(text_to_speech_sync, inputs=[yazi_girisi, dil_secimi], outputs=ses_cikti)

if __name__ == "__main__":
    demo.launch()
