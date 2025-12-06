import { Card } from "@/components/ui/card";
import { BlogMeta } from "@/components/blog/meta/BlogMeta";

export default function BlogLoading() {
  return (
    <>
      <BlogMeta />
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text mb-4">
              Perfect Gift Ideas
            </h1>
            <p className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our suggestions feel tailor-made because they practically are. We use <span className="animate-pulse-text text-primary">AI</span> and <span className="animate-pulse-text text-primary">internet magic</span> to find the absolute best gift ideas and popular presents. Thanks to us, you can spend less time gift hunting and more time celebrating (or binge-watching your favorite show—we won't judge).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="animate-pulse h-[40px] flex overflow-hidden">
                <div className="w-[40px] bg-gray-200"></div>
                <div className="flex-1 p-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
          <footer className="text-center pb-8">
            <p className="text-xs text-muted-foreground">
              Some links may contain affiliate links from Amazon and other vendors
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
