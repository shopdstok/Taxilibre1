import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';

@Injectable()
export class MapsService {
  private client: Client;

  constructor(private databaseService: DatabaseService) {
    this.client = new Client({});
  }

  async getEstimate(origin: string, destination: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not set');
    }

    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          mode: TravelMode.driving,
          key: apiKey,
        },
      });

      const element = response.data.rows[0].elements[0];
      if (element.status !== 'OK') {
        throw new Error(`Distance Matrix failed: ${element.status}`);
      }

      const distanceKm = element.distance.value / 1000;
      const durationMin = element.duration.value / 60;

      // Surge pricing logic
      const pendingRides = this.databaseService.get('SELECT COUNT(*) as count FROM rides WHERE status = "requested"') as any;
      const surgeMultiplier = pendingRides.count > 5 ? 1.5 : pendingRides.count > 2 ? 1.2 : 1.0;
      
      const basePrice = 5;
      const pricePerKm = 1.5;
      const pricePerMin = 0.5;
      
      const price = ((basePrice + (distanceKm * pricePerKm) + (durationMin * pricePerMin)) * surgeMultiplier).toFixed(2);

      return {
        distance: distanceKm.toFixed(1),
        duration: Math.round(durationMin),
        price,
        surgeMultiplier,
        currency: 'EUR'
      };
    } catch (e) {
      console.error('Google Maps API error:', e);
      throw new Error('Failed to calculate estimate');
    }
  }

  async autocomplete(input: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];

    try {
      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: apiKey,
          types: 'address',
          language: 'fr',
        },
      });

      return response.data.predictions.map(p => ({
        description: p.description,
        place_id: p.place_id,
      }));
    } catch (e) {
      console.error('Autocomplete error:', e);
      return [];
    }
  }

  async getDirections(origin: string, destination: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await this.client.directions({
        params: {
          origin,
          destination,
          mode: TravelMode.driving,
          key: apiKey,
        },
      });

      return response.data.routes[0];
    } catch (e) {
      console.error('Directions error:', e);
      return null;
    }
  }
}
