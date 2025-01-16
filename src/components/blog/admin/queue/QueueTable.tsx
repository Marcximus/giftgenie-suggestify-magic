import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueueItemStatus } from "./QueueItemStatus";
import { QueueItemActions } from "./QueueItemActions";

interface QueueItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  error_message?: string | null;
}

interface QueueTableProps {
  items: QueueItem[];
  onDeleteItem: (id: string) => Promise<void>;
}

export const QueueTable = ({ items, onDeleteItem }: QueueTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-left">#</TableHead>
            <TableHead className="text-left">Title</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Created At</TableHead>
            <TableHead className="text-left">Scheduled Date</TableHead>
            <TableHead className="text-left">Scheduled Time</TableHead>
            <TableHead className="text-left">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item: QueueItem, index: number) => (
            <TableRow key={item.id}>
              <TableCell className="text-left">{index + 1}</TableCell>
              <TableCell className="text-left">{item.title}</TableCell>
              <TableCell className="text-left">
                <QueueItemStatus status={item.status} />
              </TableCell>
              <TableCell className="text-left">
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-left">
                {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell className="text-left">
                {item.scheduled_time || '-'}
              </TableCell>
              <TableCell className="text-left">
                <QueueItemActions item={item} onDelete={onDeleteItem} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};