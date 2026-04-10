import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRemoteBlocklist, submitReport, setApiConfig, getApiConfig } from "@/blocklist/updater";

// Mock fetch globally
const fetchMock = vi.fn();
Object.defineProperty(globalThis, "fetch", { value: fetchMock, writable: true });

describe("Blocklist Updater", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe("getApiConfig / setApiConfig", () => {
    it("should return default config", () => {
      const config = getApiConfig();
      expect(config.listUrl).toContain("blocklist");
      expect(config.reportUrl).toContain("dijitalsavunma");
      expect(config.updateIntervalMinutes).toBe(360);
    });

    it("should allow partial config update", () => {
      setApiConfig({ updateIntervalMinutes: 60 });
      expect(getApiConfig().updateIntervalMinutes).toBe(60);
      // Reset
      setApiConfig({ updateIntervalMinutes: 360 });
    });
  });

  describe("fetchRemoteBlocklist", () => {
    it("should fetch plain text list and return domain count", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        headers: { get: () => "text/plain" },
        text: () => Promise.resolve("phishing1.com\nphishing2.com\n"),
      });

      const count = await fetchRemoteBlocklist();
      expect(count).toBe(2);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("blocklist"));
    });

    it("should skip comments and empty lines in plain text", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        headers: { get: () => "text/plain" },
        text: () => Promise.resolve("# USOM blocklist\nevil1.com\n\nevil2.com\n# comment\nevil3.com\n"),
      });

      const count = await fetchRemoteBlocklist();
      expect(count).toBe(3);
    });

    it("should support JSON format with content-type hint", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        headers: { get: () => "application/json" },
        text: () => Promise.resolve(JSON.stringify({
          domains: [{ domain: "a.com" }, { domain: "b.com" }],
        })),
      });

      const count = await fetchRemoteBlocklist();
      expect(count).toBe(2);
    });

    it("should return -1 on HTTP error", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      const count = await fetchRemoteBlocklist();
      expect(count).toBe(-1);
    });

    it("should return -1 on network error", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const count = await fetchRemoteBlocklist();
      expect(count).toBe(-1);
    });

    it("should return 0 when response is empty", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        headers: { get: () => "text/plain" },
        text: () => Promise.resolve(""),
      });

      const count = await fetchRemoteBlocklist();
      expect(count).toBe(0);
    });
  });

  describe("submitReport", () => {
    it("should POST report to API", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      const result = await submitReport({
        domain: "phishing.com",
        url: "https://phishing.com/login",
        reportType: "dangerous",
        description: "Fake bank login",
      });

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("reports"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("phishing.com"),
        }),
      );
    });

    it("should return false on API error", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      const result = await submitReport({
        domain: "test.com",
        url: "https://test.com",
        reportType: "safe",
        description: "",
      });

      expect(result).toBe(false);
    });

    it("should return false on network failure", async () => {
      fetchMock.mockRejectedValue(new Error("offline"));

      const result = await submitReport({
        domain: "test.com",
        url: "https://test.com",
        reportType: "dangerous",
        description: "",
      });

      expect(result).toBe(false);
    });
  });
});
