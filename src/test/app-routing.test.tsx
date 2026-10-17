import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches /dashboard/abonnement correctly", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/dashboard/abonnement");
    expect(matches.at(-1)?.routeId).toBe("/_authenticated/dashboard/abonnement");
  });

  it("matches legal and public pages correctly", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/data-deletion").at(-1)?.routeId).toBe("/data-deletion");
    expect(router.matchRoutes("/privacy").at(-1)?.routeId).toBe("/privacy");
    expect(router.matchRoutes("/terms").at(-1)?.routeId).toBe("/terms");
  });
});
