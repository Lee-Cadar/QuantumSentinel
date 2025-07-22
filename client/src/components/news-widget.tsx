import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, ExternalLink, Clock, MapPin, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

interface NewsArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  source: string;
  disasterType: string | null;
  location: string | null;
  publishedAt: string;
  relevanceScore: number | null;
}

export function NewsWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["/api/news"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["/api/news"],
      });
      
      // Trigger news refresh from external sources
      await fetch("/api/news/refresh", { method: "POST" });
      
      // Invalidate news queries to get fresh data
      await queryClient.invalidateQueries({
        queryKey: ["/api/news"],
      });
    } catch (error) {
      console.error("Failed to refresh news:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getDisasterIcon = (disasterType: string | null) => {
    switch (disasterType?.toLowerCase()) {
      case 'earthquake':
        return '🌍';
      case 'flood':
        return '🌊';
      case 'hurricane':
      case 'typhoon':
      case 'cyclone':
        return '🌀';
      case 'wildfire':
      case 'forest fire':
        return '🔥';
      case 'volcano':
        return '🌋';
      case 'tornado':
        return '🌪️';
      case 'drought':
        return '🏜️';
      default:
        return '⚠️';
    }
  };

  const getRelevanceColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    if (score >= 7) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (score >= 5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-card h-full">
      <div className="dashboard-card-header flex flex-row items-center justify-between">
        <h3 className="dashboard-card-title">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Natural Disaster News
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="dashboard-card-content p-0">
        <ScrollArea className="h-[500px] px-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (articles as NewsArticle[]).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No disaster news available</p>
              <p className="text-sm">Click refresh to fetch latest news</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {(articles as NewsArticle[]).map((article: NewsArticle) => (
                <div
                  key={article.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-1 flex-shrink-0">
                      {getDisasterIcon(article.disasterType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1">
                          {article.title}
                        </h4>
                        {article.relevanceScore && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-1.5 py-0.5 ${getRelevanceColor(article.relevanceScore)}`}
                          >
                            {article.relevanceScore}/10
                          </Badge>
                        )}
                      </div>
                      
                      {article.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {article.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(article.publishedAt)}
                        </div>
                        
                        {article.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {article.location}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <span>via {article.source}</span>
                        </div>
                        
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Read
                        </a>
                      </div>
                      
                      {article.disasterType && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {article.disasterType.charAt(0).toUpperCase() + article.disasterType.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}