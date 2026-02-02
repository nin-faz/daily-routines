import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import UserMenu from "@/components/layout/UserMenu";

const Header = () => {
  return (
    <>
      {/* Mobile */}
      <div className="flex items-center justify-end gap-1 sm:hidden mb-2">
        <ThemeToggle />
        <ThemeSelector />
        <UserMenu />
      </div>
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-end gap-2 mb-2">
        <ThemeToggle />
        <ThemeSelector />
        <UserMenu />
      </div>
    </>
  );
};

export default Header;
