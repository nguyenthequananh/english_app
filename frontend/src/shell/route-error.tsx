import { Link, useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div role="alert" data-testid="route-error" className="mx-auto mt-16 max-w-md p-4 text-center">
      <p>Có lỗi khi hiển thị trang này.</p>
      <Link to="/">Về trang chủ</Link>
    </div>
  );
}
