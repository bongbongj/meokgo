import React from "react";
import JoinScreen from "../../screens/JoinScreen";

// BE가 만드는 초대 링크 경로 (/invite/{token}) — /join/{token}과 같은 화면
export default function Invite() {
  return <JoinScreen />;
}
