# Onlayn baholaş platformasini ulaş (Google Sheets + Apps Script)

Platforma maʼlumotlari (talabalar, darslar, javoblar, davomat, savollar banki) **sizning Google hisobingizdagi**
bitta Google Sheets jadvalida saqlanadi. Server — şu jadvalga biriktirilgan Apps Script veb-ilovasi. Bepul,
reklamasiz, maʼlumotlarni istalgan vaqtda Excelʼga yuklab oliş mumkin. Ulaş taxminan 5 daqiqa oladi.

## 1. Jadval va skript
1. Google Driveʼda **Yangi → Google Sheets** yarating, nomi: `Expert — 3D modellaştiriş bazasi`.
2. Jadvalda **Kengaytmalar → Apps Script** (Extensions → Apps Script) ni oçing.
3. Oçilgan `Code.gs` faylidagi namunaviy kodni öçirib, ombordagi [`platform/Code.gs`](https://github.com/Masterpure-rgb/Expert/blob/main/platform/Code.gs) (GitHubʼda «Copy raw file» tugmasi bilan nusxalang) faylining
   **butun** matnini qöying va saqlang (**Ctrl + S**).
4. Yuqoridagi funksiyalar röyxatidan `setup` ni tanlab **Run** ni bosing. Google ruxsat söraydi:
   *Review permissions → hisobingiz → Advanced → Go to … (unsafe) → Allow*. Natijada jadvalda
   `talabalar`, `darslar`, `javoblar`, `davomat`, `savollar`, `sozlamalar` varaqlari paydo böladi.

## 2. Veb-ilova sifatida joylaş
1. **Deploy → New deployment**, turi: **Web app**.
2. *Execute as*: **Me** (siz), *Who has access*: **Anyone**.
3. **Deploy** ni bosing va `…/exec` bilan tugaydigan **Web app URL** manzilini nusxalang.

## 3. Admin panelni ulaş
1. <https://masterpure-rgb.github.io/Expert/admin/> ni oçing.
2. «Server manzili» maydoniga nusxalangan manzilni qöying, yangi parol örnating (kamida 6 belgi) — tayyor.
3. Talabalarning telefonlari ham şu serverga ulanişi uçun manzilni ombordagi [`config.js`](https://github.com/Masterpure-rgb/Expert/blob/main/config.js)
   fayliga yozing: GitHubʼda faylni oçib ✏️ (Edit) → `api: "https://script.google.com/macros/s/…/exec",` →
   **Commit changes**. (Yoki manzilni mualliflarga yuboring — ular joylab beradi.)

## 4. Boşlanğiç maʼlumotlar
* **Savollar banki** bölimida kitob bilan berilgan `savollar_banki.json` faylini yuklang. Töğri javoblar faqat
  jadvalda saqlanadi, talabalar sahifasiga yuborilmaydi. Öz savollaringizni `savollar` varağiga qöşişingiz mumkin.
* **Talabalar** bölimida Excel (xlsx), CSV fayldan yoki qölda kiriting. Har bir talabaga 6 xonali ID beriladi —
  «ID kartoçkalarni çop etiş» tugmasi bilan tarqating.

## 5. Darsda
1. **Onlayn dars → Darsni yaratiş** (guruh, mavzu, boşlaniş vaqti).
2. Nazariya tuşuntirilgaç, **A. Tezkor test — boşlaş** ni bosing: ekranda 4 xonali kod paydo böladi.
   **Proyektor rejimi** kod va QR-kodni katta körsatadi.
3. Talabalar kitobdagi uçinçi QR-kodni (✅ Topşiriq) skanerlab, ID va kodni kiritadi; javoblar avtomatik baholanadi,
   QR orqali kirgan talaba davomatda «keldi» yoki kechikkan daqiqalari bilan «kech qoldi» deb belgilanadi.
4. **Bosqiçni yopiş** dan söng taqsimotni körsatib, savolni muhokama qiling (Peer Instruction), keyin **B** va **C**
   bosqiçlarini boşlang. Ochiq javoblarni «Javoblar» jadvalida 0–2 ball bilan baholang.
5. **Davomat** bölimida holatlarni tekşiring/özgartiring, **Jurnal** bölimidan Excel (CSV) yuklab oling.

## Yangilaş va xavfsizlik
* Kod yangilansa: Apps Scriptʼda `Code.gs` ni almaştiring → **Deploy → Manage deployments → ✏️ → Version: New version
  → Deploy**. Manzil özgarmaydi.
* Admin amallari parol va 6 soatlik tokenni talab qiladi; talaba faqat öz ID raqami va sessiya kodi bilan faol
  bosqiçga javob bera oladi, bir bosqiçga bir marta. Bitta qurilmadan bir neçta ID işlatilsa, panel ogohlantiradi.
* Bepul Google hisobi bir vaqtning özida ~30 tagaça sörovni bajaradi; javob yuborilmasa sahifa avtomatik qayta urinadi.
