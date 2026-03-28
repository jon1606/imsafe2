import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Group } from "@/types";

interface GroupCardProps {
  group: Group & {
    _count: { members: number };
    safeCounts?: { safe: number; needHelp: number; noUpdate: number };
  };
}

export function GroupCard({ group }: GroupCardProps) {
  const { safeCounts } = group;

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
        <CardContent className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full h-11 w-11 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{group.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {group._count.members} member{group._count.members !== 1 ? "s" : ""}
              </p>
            </div>

            {safeCounts && (
              <div className="flex gap-1 flex-shrink-0">
                {safeCounts.safe > 0 && (
                  <Badge variant="safe" className="text-xs px-1.5 py-0">
                    {safeCounts.safe} ✓
                  </Badge>
                )}
                {safeCounts.needHelp > 0 && (
                  <Badge variant="danger" className="text-xs px-1.5 py-0">
                    {safeCounts.needHelp} !
                  </Badge>
                )}
              </div>
            )}

            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
