const axios = require("axios");
const monolithClient = require("../../src/services/monolithClient");

jest.mock("axios");

describe("MonolithClient", () => {
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env.MONOLITH_BASE_URL;
  });

  afterEach(() => {
    process.env.MONOLITH_BASE_URL = originalEnv;
  });

  describe("getUserFcmToken", () => {
    const userId = "user123";
    const mockFcmToken = "mock-fcm-token";

    it("deve retornar o token FCM quando a requisição for bem-sucedida", async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          token: mockFcmToken,
        },
      });

      const result = await monolithClient.getUserFcmToken(userId);

      expect(result).toBe(mockFcmToken);
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:4041/api/auth/user/user123/fcm-token",
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
    });

    it("deve retornar null quando o token não for encontrado", async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await monolithClient.getUserFcmToken(userId);

      expect(result).toBeNull();
    });

    it("deve retornar null quando a resposta não tiver status 200", async () => {
      axios.get.mockResolvedValue({
        status: 404,
        data: {
          token: mockFcmToken,
        },
      });

      const result = await monolithClient.getUserFcmToken(userId);

      expect(result).toBeNull();
    });

    it("deve retornar null quando ocorrer um erro na requisição", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));

      const result = await monolithClient.getUserFcmToken(userId);

      expect(result).toBeNull();
    });

    it("deve usar a URL base do ambiente quando definida", async () => {
      process.env.MONOLITH_BASE_URL = "http://monolith.example.com";
      const newMonolithClient = require("../../src/services/monolithClient");

      axios.get.mockResolvedValue({
        status: 200,
        data: {
          token: mockFcmToken,
        },
      });

      const result = await newMonolithClient.getUserFcmToken(userId);

      expect(result).toBe(mockFcmToken);
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:4041/api/auth/user/user123/fcm-token",
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      jest.resetModules();
    });

    it("deve retornar null quando a resposta não contiver dados", async () => {
      axios.get.mockResolvedValue({
        status: 200,
      });

      const result = await monolithClient.getUserFcmToken(userId);

      expect(result).toBeNull();
    });

    it("deve retornar null quando o timeout for excedido", async () => {
      axios.get.mockRejectedValue(new Error("timeout of 5000ms exceeded"));

      const result = await monolithClient.getUserFcmToken(userId);

      expect(result).toBeNull();
    });
  });
});
