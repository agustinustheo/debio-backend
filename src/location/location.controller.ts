import { Controller, Get, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { CountryService } from './country.service';
import { StateService } from './state.service';

@Controller('location')
export class LocationController {
  constructor(
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
    private readonly cityService: CityService,
  ) {}

  @Get()
  async getLocation(
    @Query('country_code') country_code: string,
    @Query('state_code') state_code: string,
    @Query('city_id') city_id: number,
  ) {
    let resLocation;

    if (city_id) {
      resLocation = await this.cityService.getOneCity(city_id);
        resLocation['name'] = resLocation['name'].trim();
    } else {
      if (state_code) {
        resLocation = await this.cityService.getAllCity(
          country_code,
          state_code,
        );
      } else if (country_code) {
        resLocation = await this.stateService.getAllRegion(country_code);
      } else {
        resLocation = await this.countryService.getAll();
        console.log("masuk-->", resLocation);
        
      }
      resLocation.forEach((element) => {
          element['name'] = element['name'].trim();
      });
    }
    return { status: 'ok', data: resLocation };
  }
}