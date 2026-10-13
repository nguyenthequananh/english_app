import { useRouteError } from 'react-router';
import { ButtonLink } from '../ui/button';
import { Card } from '../ui/card';
import { EmptyState } from '../ui/empty-state';

export default function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card role="alert" data-testid="route-error" padded={false} className="w-full max-w-sm">
        <EmptyState
          icon="cross"
          title="Có lỗi khi hiển thị trang này."
          description="Dữ liệu của bạn không bị ảnh hưởng. Hãy quay về trang chủ rồi thử lại."
          action={<ButtonLink to="/">Về trang chủ</ButtonLink>}
        />
      </Card>
    </div>
  );
}
