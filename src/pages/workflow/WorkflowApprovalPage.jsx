import { useOutletContext } from "react-router-dom";
import { WorkflowPage } from "../WorkflowPage";

export default function WorkflowApprovalPage({ stage }) {
  // Retrieve shared state from MainLayout's Outlet context
  const context = useOutletContext() || {};
  const { currentUser, onRefreshData } = context;

  // Map stage prop (MAKER, CHECKER, VERIFICATION, etc.) to corresponding tab ids
  const mapStageToTab = (stg) => {
    switch (stg) {
      case "MAKER":
        return "maker";
      case "CHECKER":
        return "checker";
      case "VERIFICATION":
        return "verification";
      case "APPROVAL_1":
        return "approved1";
      case "APPROVAL_2":
        return "approved2";
      case "APPROVAL_3":
        return "approved3";
      default:
        return "all";
    }
  };

  const initialStage = mapStageToTab(stage);

  return (
    <WorkflowPage
      currentUser={currentUser}
      onRefreshData={onRefreshData}
      initialStage={initialStage}
    />
  );
}
