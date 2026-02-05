import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import UserMenu from "@/components/layout/UserMenu";
import HelpButton from "@/components/shared/HelpButton";

const Header = () => {
  return (
    <>
      {/* Mobile */}
      <div className="flex items-center justify-end gap-1 sm:hidden mb-2">
        <ThemeToggle />
        <ThemeSelector />
        <UserMenu />
        <div className="w-px h-5 bg-border" />
        <HelpButton />
      </div>
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-end gap-2 mb-2">
        <ThemeToggle />
        <ThemeSelector />
        <UserMenu />
        <div className="w-px h-6 bg-border" />
        <HelpButton />
      </div>
    </>
  );
};

export default Header;
