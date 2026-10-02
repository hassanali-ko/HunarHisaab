import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { Logo, Star } from "@/components/marks";

export default function NotFound() {
  return (
    <>
      <header className="mx-auto w-full max-w-md px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main
        id="main"
        dir="ltr"
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-20 text-center"
      >
        <Star size={26} className="text-marigold" />
        <h1 className="mt-5 text-[1.7rem] leading-tight">
          There is nothing on this page
        </h1>
        <p className="mt-2 text-[15px] text-soft">
          The link may be old, or it may have been switched off by whoever sent
          it.
        </p>
        <ButtonLink href="/" className="mt-6">
          Go to the start
        </ButtonLink>
      </main>
    </>
  );
}
