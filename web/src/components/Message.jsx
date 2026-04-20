export function Message({ error, isBootstrapping }) {
  if (error) {
    return <div className="message error">{error}</div>;
  }
  if (!error && isBootstrapping) {
    return <div className="message">正在连接后端...</div>;
  }
  return null;
}
