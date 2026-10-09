<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected string $token;
    protected string $baseUrl = 'https://api.fonnte.com/send';

    public function __construct()
    {
        $this->token = config('services.fonnte.token');
    }

    /**
     * Kirim pesan WhatsApp ke satu atau beberapa nomor.
     *
     * @param string|array $targets  Nomor tujuan, format: "628123456789"
     * @param string       $message  Isi pesan (mendukung format *bold* WA)
     */
    public function send(string|array $targets, string $message): bool
    {
        if (empty($targets)) {
            return false;
        }

        // Fonnte menerima multiple target dipisahkan koma
        $target = is_array($targets)
            ? implode(',', array_filter($targets))
            : $targets;

        if (empty(trim($target))) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->baseUrl, [
                'target'      => $target,
                'message'     => $message,
                'countryCode' => '62', // Indonesia
            ]);

            if (! $response->successful()) {
                Log::warning('Fonnte: Gagal kirim WA', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return false;
            }

            Log::info('Fonnte: WA terkirim', [
                'target' => $target,
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error('Fonnte: Exception saat kirim WA', [
                'message' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
