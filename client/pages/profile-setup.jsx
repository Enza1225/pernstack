// ДАН системээс ирсэн мэдээлэл автоматаар хадгалагддаг тул энэ хуудас хэрэггүй
export default function Removed() {
  if (typeof window !== "undefined") window.location.href = "/";
  return null;
}
