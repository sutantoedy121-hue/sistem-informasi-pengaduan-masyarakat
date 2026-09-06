import {
  TrafficCone,
  Lightbulb,
  Trash2,
  Droplets,
  FileText,
  ShieldCheck,
  Inbox,
  CheckCircle2,
  Loader,
  Timer,
  PenLine,
  Ticket,
  Wrench,
  Star,
  Search,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  TrafficCone,
  Lightbulb,
  Trash2,
  Droplets,
  FileText,
  ShieldCheck,
  Inbox,
  CheckCircle2,
  Loader,
  Timer,
  PenLine,
  Ticket,
  Wrench,
  Star,
  Search,
};

interface IconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, className, strokeWidth = 2 }: IconProps) {
  const Cmp = iconMap[name] ?? ShieldCheck;
  return <Cmp className={className} strokeWidth={strokeWidth} />;
}
