interface QueueItemStatusProps {
  status: string;
}

export const QueueItemStatus = ({ status }: QueueItemStatusProps) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${status === 'completed' ? 'bg-green-100 text-green-800' :
        status === 'processing' ? 'bg-blue-100 text-blue-800' :
        status === 'failed' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'}`}>
      {status}
    </span>
  );
};