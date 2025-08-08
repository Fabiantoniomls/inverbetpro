import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración de tu cuenta y tus preferencias de la aplicación.
        </p>
      </div>
      <div className="max-w-4xl">
        <SettingsForm />
      </div>
    </div>
  )
}
