import { permanentRedirect } from "next/navigation";

export default function LegacySeoSettingsPage() {
  permanentRedirect("/admin/settings/seo");
}
