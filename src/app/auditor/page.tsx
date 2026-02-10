import { CodeAnalyzer } from "@/components/code-analyzer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function AuditorPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <nav className="flex gap-4">
             <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Button>
             </Link>
          </nav>
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <CodeAnalyzer />
        </div>
      </main>
    </div>
  );
}
