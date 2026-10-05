import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Wasla API",
    version: "1.0.0",
    description: "REST API لمنصة وصلة لتأجير الآليات الزراعية"
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/auth/register": { post: { summary: "Register farmer or machinery owner", responses: { "201": { description: "Created" }, "400": { description: "Validation error" } } } },
    "/auth/login": { post: { summary: "Login with phone and password", responses: { "200": { description: "Authenticated" }, "401": { description: "Invalid credentials" } } } },
    "/auth/logout": { post: { summary: "Clear auth cookies", responses: { "200": { description: "Logged out" } } } },
    "/auth/me": { get: { summary: "Current user", responses: { "200": { description: "Current session" } } } },
    "/categories": { get: { summary: "List active machinery categories", responses: { "200": { description: "Categories" } } } },
    "/locations": { get: { summary: "List active locations", responses: { "200": { description: "Locations" } } } },
    "/machinery": {
      get: { summary: "Search public approved machinery", parameters: ["q", "category", "location", "pricingType", "canTravel", "sort"].map((name) => ({ name, in: "query", schema: { type: "string" } })), responses: { "200": { description: "Paginated machinery" } } },
      post: { summary: "Create machinery listing", responses: { "201": { description: "Created pending approval" }, "403": { description: "Forbidden" } } }
    },
    "/machinery/{slug}": { get: { summary: "Machinery details", parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Machinery" }, "404": { description: "Not found" } } } },
    "/bookings": {
      get: { summary: "List current user's bookings", responses: { "200": { description: "Bookings" } } },
      post: { summary: "Create booking request", responses: { "201": { description: "Booking created" }, "409": { description: "Booking conflict" } } }
    },
    "/owner/bookings/{id}/accept": { patch: { summary: "Owner accepts booking", responses: { "200": { description: "Accepted" } } } },
    "/owner/bookings/{id}/reject": { patch: { summary: "Owner rejects booking", responses: { "200": { description: "Rejected" } } } },
    "/bookings/{id}/review": { post: { summary: "Review completed booking", responses: { "201": { description: "Review created" }, "409": { description: "Not allowed" } } } },
    "/admin/dashboard": { get: { summary: "Admin dashboard counters", responses: { "200": { description: "Counters" } } } },
    "/admin/machinery/pending": { get: { summary: "Pending machinery listings", responses: { "200": { description: "Pending listings" } } } },
    "/admin/machinery/{id}/approve": { patch: { summary: "Approve listing", responses: { "200": { description: "Approved" } } } },
    "/admin/machinery/{id}/reject": { patch: { summary: "Reject listing", responses: { "200": { description: "Rejected" } } } }
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "wasla_access" }
    }
  }
};

export async function GET() {
  return NextResponse.json(spec);
}
