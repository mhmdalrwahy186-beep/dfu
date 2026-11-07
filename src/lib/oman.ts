/** Governorates of the Sultanate of Oman and their wilayats (11 governorates, 63 wilayats). */
export const OMAN_GOVERNORATES: { name: string; wilayats: string[] }[] = [
  { name: "مسقط", wilayats: ["مسقط", "مطرح", "بوشر", "السيب", "العامرات", "قريات"] },
  {
    name: "ظفار",
    wilayats: ["صلالة", "طاقة", "مرباط", "رخيوت", "ثمريت", "ضلكوت", "المزيونة", "مقشن", "شليم وجزر الحلانيات", "سدح"],
  },
  { name: "مسندم", wilayats: ["خصب", "بخا", "دبا", "مدحاء"] },
  { name: "البريمي", wilayats: ["البريمي", "محضة", "السنينة"] },
  { name: "الداخلية", wilayats: ["نزوى", "بهلاء", "منح", "الحمراء", "أدم", "إزكي", "سمائل", "بدبد", "الجبل الأخضر"] },
  { name: "شمال الباطنة", wilayats: ["صحار", "شناص", "لوى", "صحم", "الخابورة", "السويق"] },
  { name: "جنوب الباطنة", wilayats: ["الرستاق", "العوابي", "نخل", "وادي المعاول", "بركاء", "المصنعة"] },
  { name: "جنوب الشرقية", wilayats: ["صور", "الكامل والوافي", "جعلان بني بو حسن", "جعلان بني بو علي", "مصيرة"] },
  { name: "شمال الشرقية", wilayats: ["إبراء", "المضيبي", "بدية", "القابل", "وادي بني خالد", "دماء والطائيين", "سناو"] },
  { name: "الظاهرة", wilayats: ["عبري", "ينقل", "ضنك"] },
  { name: "الوسطى", wilayats: ["هيماء", "محوت", "الدقم", "الجازر"] },
];

export const GOVERNORATE_NAMES = OMAN_GOVERNORATES.map((g) => g.name);

export function wilayatsOf(governorate: string): string[] {
  return OMAN_GOVERNORATES.find((g) => g.name === governorate)?.wilayats ?? [];
}

export function isValidLocation(governorate: string, wilayat: string) {
  return wilayatsOf(governorate).includes(wilayat);
}

/** Rough centre of Oman, used as the default map view. */
export const OMAN_CENTER: [number, number] = [21.47, 55.98];
export const MUSCAT_CENTER: [number, number] = [23.588, 58.3829];

/** Loose bounding box (with margin) to reject coordinates far outside Oman. */
export function isInsideOman(lat: number, lng: number) {
  return lat >= 16.4 && lat <= 26.6 && lng >= 51.8 && lng <= 60.1;
}
