import { Route } from 'wouter';

import { LockButton } from '../../common/components/LockButton';
import { MouseLeftButton } from '../../common/ui/MouseLeftButtonIcon';
import { useStore } from '../../store/store';
import { Nav, routes } from '../Nav';
import { Achievements as AchievementsPage } from './Achievements';
import { SettingsPage } from './Settings';

export function UserMenus(): JSX.Element | null {
  const isLocked = useStore((state) => state.isLocked);

  if (isLocked) {
    return null;
  }

  return (
    <main className="flex absolute w-screen h-screen justify-center z-50 top-0 left-0 overflow-hidden">
      <div className="absolute inset-0 bg-tViolet/70" aria-hidden="true" />
      <div className="container mx-auto flex flex-row p-6 relative z-10">
        <div className="w-1/3 flex">
          <Nav />
        </div>
        <div className="w-2/3 flex">
          <Route path="/">
            <div className="flex items-end w-full mb-16">
              <div className="flex-col w-full">
                <div className="flex flex-col w-full items-end justify-end mb-20">
                  <div className="text-9xl font-black">Kitchen</div>
                  <div className="my-3">
                    <LockButton />
                  </div>
                </div>
                <div className="flex w-full align-middle justify-between py-8">
                  <div className="flex flex-col place-content-end">
                    <div>
                      <div className="keyboard-btn ml-12">W</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="keyboard-btn">A</div>
                      <div className="keyboard-btn">S</div>
                      <div className="keyboard-btn">D</div>
                    </div>
                    <div className="action-description">move</div>
                  </div>
                  <div className="flex flex-col place-content-end">
                    <div className="flex place-content-center mb-3">
                      <MouseLeftButton width={48} height={48} />
                    </div>
                    <div className="action-description">
                      open / pick / interact
                    </div>
                  </div>
                  <div className="flex flex-col place-content-end">
                    <div className="keyboard-btn place-items-end place-content-start w-40 m-1 pb-1 pl-2 ">
                      Space
                    </div>
                    <div className="action-description">throw</div>
                  </div>
                  <div className="flex flex-col place-content-end">
                    <div className="keyboard-btn place-items-end place-content-start w-20 m-1 pb-1 pl-2 ">
                      Esc
                    </div>
                    <div className="action-description">exit</div>
                  </div>
                </div>
              </div>
            </div>
          </Route>
          <Route path={routes.ACHIEVEMENTS} component={AchievementsPage} />
          <Route path={routes.SETTINGS} component={SettingsPage} />
        </div>
      </div>
    </main>
  );
}
