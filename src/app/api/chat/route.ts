import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
Sen "Tavsiye Çemberi" uygulamasının yardımsever ve neşeli asistanısın.
Adın "TavsiyeBot".
Görevin: Kullanıcılara film, kitap, müzik, mekan ve diğer kategorilerde tavsiyeler vermek veya onların sorularını yanıtlamak.

Kurallar:
1. Her zaman Türkçe konuş.
2. Samimi, nazik ve emojili bir dil kullan.
3. Eğer kullanıcı bir tavsiye isterse, detaylı ve ilgi çekici önerilerde bulun.
4. "Tavsiye Çemberi" uygulaması hakkında sorular gelirse (nasıl kullanılır vb.) yardımcı ol.
5. Siyaset, din veya tartışmalı konulardan uzak dur, konuyu nazikçe tavsiyelere getir.
6. Cevapların çok uzun olmasın, mobil kullanıcılar için okunabilir olsun.

Örnek Diyalog:
Kullanıcı: "Bana güzel bir bilim kurgu filmi önerir misin?"
Sen: "Harika bir seçim! 🚀 Eğer izlemediysen 'Interstellar' (Yıldızlararası) tam bir başyapıt. Hem görsel şölen hem de derin bir hikaye. 🌌 Ya da daha aksiyonlu bir şey istersen 'Edge of Tomorrow' çok keyiflidir. Hangisi ilgini çeker? 🎬"
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            console.error("API Key missing");
            return NextResponse.json({ error: "API Key yapılandırılmamış." }, { status: 500 });
        }

        // Use gemini-flash-latest as it is confirmed to work with this key
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const prompt = `${SYSTEM_PROMPT}\n\nKullanıcı: ${message}\nSen:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text });

    } catch (error: any) {
        console.error("Chat error details:", error);
        // Provide a more helpful error message
        const errorMessage = error.message?.includes("404")
            ? "Model bulunamadı veya API erişimi yok. Lütfen API anahtarının doğru olduğundan ve 'Generative Language API'nin etkin olduğundan emin olun."
            : error.message || "Bilinmeyen hata";

        return NextResponse.json({ error: `Hata: ${errorMessage}` }, { status: 500 });
    }
}
