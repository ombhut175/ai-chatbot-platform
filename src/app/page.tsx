import { redirect } from "next/navigation"
import { AppRoute } from "@/helpers/string_const/routes"

export default function HomePage() {
  redirect(AppRoute.LOGIN)
}
