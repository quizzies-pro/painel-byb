import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Layers,
  PlayCircle,
  GraduationCap,
  Users,
  CreditCard,
  Webhook,
  Settings2,
  FileText,
  BarChart3,
  DollarSign,
  UserCheck,
} from "lucide-react";

export interface Permissions {
  courses: { view: boolean; manage: boolean };
  modules: { view: boolean; manage: boolean };
  lessons: { view: boolean; manage: boolean };
  students: { view: boolean; manage: boolean };
  enrollments: { view: boolean; manage: boolean };
  payments: { view: boolean };
  webhooks: { view: boolean; manage: boolean };
  settings: { view: boolean };
  logs: { view: boolean };
  dashboard: {
    revenue: boolean;
    students: boolean;
    enrollments: boolean;
    payments: boolean;
  };
}

export const DEFAULT_PERMISSIONS: Permissions = {
  courses: { view: true, manage: true },
  modules: { view: true, manage: true },
  lessons: { view: true, manage: true },
  students: { view: true, manage: true },
  enrollments: { view: true, manage: true },
  payments: { view: true },
  webhooks: { view: true, manage: true },
  settings: { view: true },
  logs: { view: true },
  dashboard: { revenue: true, students: true, enrollments: true, payments: true },
};

interface PermissionsEditorProps {
  permissions: Permissions;
  onChange: (permissions: Permissions) => void;
  disabled?: boolean;
}

interface PermissionSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  fields: { key: string; label: string }[];
}

const sectionConfig: PermissionSection[] = [
  {
    key: "courses",
    label: "Cursos",
    icon: <BookOpen className="h-4 w-4" />,
    fields: [
      { key: "view", label: "Visualizar" },
      { key: "manage", label: "Criar / Editar / Excluir" },
    ],
  },
  {
    key: "modules",
    label: "Módulos",
    icon: <Layers className="h-4 w-4" />,
    fields: [
      { key: "view", label: "Visualizar" },
      { key: "manage", label: "Criar / Editar / Excluir" },
    ],
  },
  {
    key: "lessons",
    label: "Aulas",
    icon: <PlayCircle className="h-4 w-4" />,
    fields: [
      { key: "view", label: "Visualizar" },
      { key: "manage", label: "Criar / Editar / Excluir" },
    ],
  },
  {
    key: "students",
    label: "Alunos",
    icon: <Users className="h-4 w-4" />,
    fields: [
      { key: "view", label: "Visualizar" },
      { key: "manage", label: "Criar / Editar / Excluir" },
    ],
  },
  {
    key: "enrollments",
    label: "Matrículas",
    icon: <GraduationCap className="h-4 w-4" />,
    fields: [
      { key: "view", label: "Visualizar" },
      { key: "manage", label: "Criar / Editar / Excluir" },
    ],
  },
  {
    key: "payments",
    label: "Pagamentos",
    icon: <CreditCard className="h-4 w-4" />,
    fields: [{ key: "view", label: "Visualizar" }],
  },
  {
    key: "webhooks",
    label: "Webhooks",
    icon: <Webhook className="h-4 w-4" />,
    fields: [
      { key: "view", label: "Visualizar" },
      { key: "manage", label: "Criar / Editar / Excluir" },
    ],
  },
  {
    key: "settings",
    label: "Configurações",
    icon: <Settings2 className="h-4 w-4" />,
    fields: [{ key: "view", label: "Visualizar" }],
  },
  {
    key: "logs",
    label: "Logs de Atividade",
    icon: <FileText className="h-4 w-4" />,
    fields: [{ key: "view", label: "Visualizar" }],
  },
];

const dashboardFields = [
  { key: "revenue", label: "Faturamento", icon: <DollarSign className="h-3.5 w-3.5" /> },
  { key: "students", label: "Total de Alunos", icon: <UserCheck className="h-3.5 w-3.5" /> },
  { key: "enrollments", label: "Total de Matrículas", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { key: "payments", label: "Total de Pagamentos", icon: <CreditCard className="h-3.5 w-3.5" /> },
];

export function PermissionsEditor({ permissions, onChange, disabled }: PermissionsEditorProps) {
  const toggle = (section: string, field: string, value: boolean) => {
    const updated = { ...permissions };
    if (section === "dashboard") {
      updated.dashboard = { ...updated.dashboard, [field]: value };
    } else {
      const sec = updated[section as keyof Permissions] as Record<string, boolean>;
      updated[section as keyof Permissions] = { ...sec, [field]: value } as any;

      // If manage is on, view must be on
      if (field === "manage" && value) {
        (updated[section as keyof Permissions] as any).view = true;
      }
      // If view is off, manage must be off
      if (field === "view" && !value && (updated[section as keyof Permissions] as any).manage !== undefined) {
        (updated[section as keyof Permissions] as any).manage = false;
      }
    }
    onChange(updated);
  };

  const allOn = () => onChange(DEFAULT_PERMISSIONS);
  const allOff = () =>
    onChange({
      courses: { view: false, manage: false },
      modules: { view: false, manage: false },
      lessons: { view: false, manage: false },
      students: { view: false, manage: false },
      enrollments: { view: false, manage: false },
      payments: { view: false },
      webhooks: { view: false, manage: false },
      settings: { view: false },
      logs: { view: false },
      dashboard: { revenue: false, students: false, enrollments: false, payments: false },
    });

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={allOn}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline disabled:opacity-50"
        >
          Ativar tudo
        </button>
        <span className="text-xs text-muted-foreground">·</span>
        <button
          type="button"
          onClick={allOff}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline disabled:opacity-50"
        >
          Desativar tudo
        </button>
      </div>

      {/* Section permissions */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Gerenciamento
        </h3>
        <div className="rounded-lg border border-border divide-y divide-border">
          {sectionConfig.map((section) => {
            const sectionPerms = permissions[section.key as keyof Permissions] as Record<string, boolean>;
            return (
              <div key={section.key} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-muted-foreground">{section.icon}</span>
                  <Label className="text-sm font-medium">{section.label}</Label>
                </div>
                <div className="flex items-center gap-6 pl-6">
                  {section.fields.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Switch
                        checked={sectionPerms?.[field.key] ?? true}
                        onCheckedChange={(v) => toggle(section.key, field.key, v)}
                        disabled={disabled}
                        className="scale-90"
                      />
                      <span className="text-xs text-muted-foreground">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Dashboard visibility */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Visibilidade no Dashboard
        </h3>
        <div className="rounded-lg border border-border divide-y divide-border">
          {dashboardFields.map((field) => (
            <div
              key={field.key}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{field.icon}</span>
                <span className="text-sm">{field.label}</span>
              </div>
              <Switch
                checked={permissions.dashboard?.[field.key as keyof typeof permissions.dashboard] ?? true}
                onCheckedChange={(v) => toggle("dashboard", field.key, v)}
                disabled={disabled}
                className="scale-90"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
