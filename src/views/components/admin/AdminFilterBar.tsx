import { useState, useEffect } from "react";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";

type Option = { value: string; label: string };

type Props = {
  placeholder?: string;
  owners?: Option[];
  folders?: Option[];
  statuses?: Option[];
  roles?: Option[];
  onChange: (filters: Record<string, string>) => void;
};

const AdminFilterBar = ({
  placeholder = "Rechercher...",
  owners = [],
  folders = [],
  statuses = [],
  roles = [],
  onChange,
}: Props) => {
  const ALL = "__all__";
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState(ALL);
  const [folder, setFolder] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [role, setRole] = useState(ALL);

  useEffect(() => {
    const t = setTimeout(() => {
      // Normalize sentinel value to empty string for consumers
      const norm = (v: string) => (v === ALL ? "" : v);
      onChange({
        q,
        owner: norm(owner),
        folder: norm(folder),
        status: norm(status),
        role: norm(role),
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q, owner, folder, status, role, onChange]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
      <div className="flex-1 min-w-0">
        <Input
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {owners.length > 0 && (
        <Select value={owner} onValueChange={(v) => setOwner(v)}>
          <SelectTrigger className="sm:w-[160px] w-full">
            <SelectValue placeholder="Propriétaire" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {folders.length > 0 && (
        <Select value={folder} onValueChange={(v) => setFolder(v)}>
          <SelectTrigger className="sm:w-[160px] w-full">
            <SelectValue placeholder="Dossier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous</SelectItem>
            {folders.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {statuses.length > 0 && (
        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="sm:w-[140px] w-full">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {roles.length > 0 && (
        <Select value={role} onValueChange={(v) => setRole(v)}>
          <SelectTrigger className="sm:w-[140px] w-full">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="sm:ml-2">
        <Button
          variant="outline"
          onClick={() => {
            setQ("");
            setOwner(ALL);
            setFolder(ALL);
            setStatus(ALL);
            setRole(ALL);
            onChange({});
          }}
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default AdminFilterBar;
