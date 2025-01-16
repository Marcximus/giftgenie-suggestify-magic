import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QueueTableProps {
  queuedPosts: any[];
}

export const QueueTable = ({ queuedPosts }: QueueTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge>Published</Badge>;
      case "generating":
        return <Badge variant="secondary">Generating</Badge>;
      default:
        return <Badge variant="outline">In Queue</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Title</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Scheduled Date</TableHead>
            <TableHead className="text-left">Scheduled Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queuedPosts?.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="text-left">{post.title}</TableCell>
              <TableCell className="text-left">{getStatusBadge(post.status)}</TableCell>
              <TableCell className="text-left">
                {post.scheduled_date
                  ? new Date(post.scheduled_date).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell className="text-left">{post.scheduled_time || "-"}</TableCell>
            </TableRow>
          ))}
          {(!queuedPosts || queuedPosts.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No posts in queue
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};