import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Crime Data",
    description:
      "Real crime statistics from the Chicago Data Portal, broken down by type for each neighborhood.",
  },
  {
    title: "Affordable Housing",
    description:
      "See how many affordable rental units are available in each of Chicago's 77 community areas.",
  },
  {
    title: "Save Favorites",
    description:
      "Create an account to save neighborhoods you're interested in and compare them side by side.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-col items-center justify-center px-4 py-24">
        <h1 className="text-center text-5xl font-bold tracking-tight sm:text-6xl">
          Chicago Neighborhood Intelligence
        </h1>
        <p className="mt-6 max-w-xl text-center text-xl text-muted-foreground">
          Explore Chicago&apos;s 77 community areas using real civic data.
          Compare safety, affordable housing, and more — updated daily from
          the Chicago Data Portal.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/neighborhoods">
            <Button size="lg">Browse Neighborhoods</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 pb-16 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
