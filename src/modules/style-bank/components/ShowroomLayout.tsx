import { Outlet } from 'react-router-dom';
import { ShowroomStepper } from './ShowroomStepper';

export function ShowroomLayout() {
  return (
    <div className="flex flex-col h-full">
      <ShowroomStepper />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
