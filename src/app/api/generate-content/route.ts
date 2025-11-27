import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { title, category } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key yapılandırılmamış." }, { status: 500 });
        }

        if (!title || !category) {
            return NextResponse.json({ error: "Başlık ve kategori gerekli." }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
Sen bir tavsiye platformu için içerik yazıyorsun. 
Kullanıcı "${category}" kategorisinde "${title}" başlıklı bir tavsiye paylaşmak istiyor.

Görevin: Bu başlık ve kategori için kısa, ilgi çekici ve samimi bir tavsiye açıklaması yaz.

Kurallar:
1. Türkçe yaz.
2. Maksimum 3-4 cümle olsun.
3. Samimi ve içten bir dil kullan.
4. Emoji kullanabilirsin ama abartma (1-2 tane yeterli).
5. Neden tavsiye edildiğini belirt.
6. Kullanıcının deneyimini anlatır gibi yaz (örn: "Harika bir deneyimdi", "Çok beğendim" gibi).

Sadece açıklamayı yaz, başka bir şey ekleme.
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ content: text });

    } catch (error: any) {
        console.error("Content generation error:", error);
        return NextResponse.json({ error: `Hata: ${error.message || "Bilinmeyen hata"}` }, { status: 500 });
    }
}
