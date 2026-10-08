export default function TestPage({ kind }: { kind: 'UNIT' | 'STAGE' }) {
  return <h1 data-testid="page-test">Bài kiểm tra {kind}</h1>;
}
