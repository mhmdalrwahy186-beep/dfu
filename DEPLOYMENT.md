# دليل الإعداد والنشر

المدة المتوقعة: 30–45 دقيقة. ستحتاج: حساب [Supabase](https://supabase.com)، وحساب [Vercel](https://vercel.com) (أو أي استضافة تدعم Next.js)، واختياريًا حساب [Twilio](https://twilio.com) للرسائل النصية.

---

## 1) مشروع Supabase

1. أنشئ مشروعًا جديدًا. اختر منطقة قريبة (مثل `Middle East (Bahrain)` إن توفرت، أو `Europe (Frankfurt)`).
2. من **Project Settings → API** انسخ:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**سري — لا يوضع أبدًا في كود المتصفح ولا يبدأ بـ NEXT_PUBLIC_**)

### تطبيق قاعدة البيانات

**الطريقة أ — محرر SQL (الأسهل):** افتح **SQL Editor** ونفّذ الملفات بالترتيب، كل ملف كاملًا:

1. `supabase/migrations/20261101000001_schema.sql`
2. `supabase/migrations/20261101000002_functions.sql`
3. `supabase/migrations/20261101000003_security.sql`
4. `supabase/migrations/20261101000004_seed.sql`

**الطريقة ب — Supabase CLI:**

```bash
npx supabase init          # إن لم يوجد supabase/config.toml (لن يحذف ملفات migrations)
npx supabase link --project-ref <PROJECT-REF>
npx supabase db push
```

تُنشئ الملفات: الجداول، دوال سير العمل، سياسات RLS، حاوية التخزين الخاصة `donation-images`، نشر جدول الإشعارات في Realtime، 45 عبارة تحفيزية، والمحتوى الافتراضي للموقع.

### إعدادات المصادقة (مهم)

في **Authentication → Sign In / Providers**:
- عطّل **Allow new users to sign up** (الحسابات تُنشأ بالدعوة فقط).
- أبقِ **Email** مفعّلًا.

في **Authentication → URL Configuration**:
- **Site URL**: رابط موقعك، مثل `https://daff.example.om`
- **Redirect URLs**: أضف `https://daff.example.om/**` و`http://localhost:3000/**`

في **Authentication → Emails → Templates** عدّل الرابط في قالبين:

**Invite user**
```html
<h2>دعوة للانضمام إلى لوحة فريق دفء</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">قبول الدعوة وتعيين كلمة المرور</a></p>
```

**Reset password**
```html
<h2>إعادة تعيين كلمة المرور — فريق دفء</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">تعيين كلمة مرور جديدة</a></p>
```

> بريد Supabase الافتراضي محدود بعدد قليل من الرسائل في الساعة. للاستخدام الفعلي أضف SMTP خاصًا من **Authentication → Emails → SMTP Settings** (مثل Resend أو Brevo أو بريد المؤسسة).

---

## 2) متغيرات البيئة

انسخ `.env.example` إلى `.env.local` واملأ:

| المتغير | إلزامي | الوصف |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | المفتاح العام |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | مفتاح الخادم السري |
| `NEXT_PUBLIC_SITE_URL` | ✅ | رابط الموقع العام (بدون `/` في النهاية) |
| `APP_SECRET` | ✅ | نص عشوائي ≥ 32 حرفًا: `openssl rand -base64 48` |
| `SMS_PROVIDER` | لمتابعة التبرع | `twilio` للإنتاج، أو `console` للتطوير فقط |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | مع twilio | بيانات Twilio؛ `TWILIO_FROM` رقم Twilio أو اسم مرسل معتمد |
| `RETENTION_DAYS` | اختياري | أيام الاحتفاظ بالبيانات الشخصية بعد إغلاق الطلب (افتراضي 365) |

> بالنسبة لعُمان: إرسال الرسائل باسم مرسل (Alphanumeric Sender ID) قد يتطلب تسجيلًا مسبقًا لدى Twilio. جرّب أولًا الإرسال إلى رقمك.

---

## 3) أول مشرف عام

لا يوجد تسجيل عام، لذا أنشئ الحساب الأول من جهازك:

```bash
npm install
npm run create-super-admin -- you@example.com "الاسم الكامل"
# أو بكلمة مرور مؤقتة بدل رسالة دعوة:
npm run create-super-admin -- you@example.com "الاسم الكامل" --password
```

ادخل إلى `/admin/login`، ثم من **المشرفون والصلاحيات** ادعُ بقية الفريق، ومن **إعدادات الموقع** أضف أرقام التواصل وحسابات التواصل الاجتماعي الرسمية.

---

## 4) النشر على Vercel

1. ارفع المشروع إلى مستودع GitHub خاص.
2. في Vercel: **Add New → Project** واختر المستودع (يُكتشف Next.js تلقائيًا).
3. أضف متغيرات البيئة من الخطوة 2 في **Settings → Environment Variables**.
4. انشر، ثم اربط النطاق وحدّث `NEXT_PUBLIC_SITE_URL` و**Site URL** في Supabase.

الأوامر على أي استضافة أخرى: `npm ci && npm run build && npm start` (Node.js 20.9 أو أحدث).

> حد حجم الطلب في Vercel نحو 4.5 ميجابايت. لذلك تُضغط الصور في المتصفح ويُحدّ مجموعها بـ 4 ميجابايت للطلب الواحد.

---

## 5) بعد النشر — قائمة تحقق

- [ ] أرسل تبرعًا تجريبيًا من الجوال وتأكد من ظهوره في `/admin` مع إشعار فوري.
- [ ] افتح زر واتساب وتأكد من الرقم والرسالة.
- [ ] حدّد موعدًا وأسند متطوعًا، ثم سجّل الدخول بحساب المتطوع وتأكد أنه لا يرى إلا طلبه.
- [ ] جرّب «متابعة تبرعي» (يتطلب إعداد SMS).
- [ ] صدّر ملف Excel وتحقق من الأعمدة العربية.
- [ ] احذف الطلب التجريبي: غيّر حالته إلى «ملغي» ثم استخدم «حذف البيانات الشخصية» (مشرف عام).

---

## 6) الاحتفاظ بالبيانات وحذفها

- يستطيع المشرف العام حذف البيانات الشخصية لأي طلب مكتمل أو ملغي من صفحة تفاصيله (تبقى الإحصاءات فقط).
- للحذف الدوري التلقائي، شغّل شهريًا:

```bash
npm run retention -- --dry-run   # عرض الطلبات المستحقة فقط
npm run retention                # تنفيذ الحذف
```

يمكن جدولته عبر GitHub Actions (cron) بمتغيرات Supabase كأسرار، أو تشغيله يدويًا كل شهر.

---

## 7) الأمان باختصار

- المتصفح لا يملك أي صلاحية على بيانات المتبرعين: إرسال التبرع عبر مسار خادم يتحقق من البيانات (Zod)، ويطبّق حدودًا للطلبات لكل IP ورقم، ويستخدم حقلًا فخًّا للبرامج الآلية، ومفتاح عدم التكرار يمنع ازدواج الطلبات.
- كل عمليات اللوحة تمر بدوال SQL تتحقق من الصلاحية بنفسها، ومحمية بسياسات RLS (مختبرة في `supabase/tests/security.test.sql`).
- الصور في حاوية خاصة وتُعرض بروابط موقّعة مدتها 10 دقائق، ويُتحقق من نوعها الحقيقي (magic bytes) لا من امتدادها.
- المتابعة للمتبرع برمز لمرة واحدة مُخزّن مُجزّأً (hash)، مع حد للمحاولات، وإجابة موحدة لا تكشف وجود الطلب.
- ترويسات أمان (CSP، HSTS، منع التضمين)، ولوحة التحكم مستثناة من محركات البحث.
- عناوين IP لا تُخزن، بل بصمة مشفرة منها لأغراض الحد من الإساءة فقط.
