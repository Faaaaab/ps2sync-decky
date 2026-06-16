import { definePlugin, staticClasses } from "decky-frontend-lib";
import { VFC } from "react";
import App from "./App";

const Content: VFC = () => <App />;

export default definePlugin(() => ({
  title: <div className={staticClasses.Title}>PS2Sync</div>,
  content: <Content />,
  icon: <div>🎮</div>,
}));
