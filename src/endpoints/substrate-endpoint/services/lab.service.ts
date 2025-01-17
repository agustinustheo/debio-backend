import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class LabService {
  private readonly logger: Logger = new Logger(LabService.name);
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async getByCountryCityCategory(
    country: string,
    region: string,
    city: string,
    category: string,
    page: number,
    size: number,
  ) {
    const searchMustList: Array<any> = [
      {
        match_phrase_prefix: { 'info.country': { query: country } },
      },
    ];

    if (region !== undefined && region !== null && region.trim() !== '') {
      searchMustList.push({
        match_phrase_prefix: { 'info.region': { query: region } },
      });
    }

    if (city !== undefined && city !== null && city.trim() !== '') {
      searchMustList.push({
        match_phrase_prefix: { 'info.city': { query: city } },
      });
    }

    const searchObj = {
      index: 'labs',
      body: {
        query: {
          bool: {
            must: searchMustList,
          },
        },
      },
      from: (size * page - size) | 0,
      size: size | 10,
    };

    const result = [];
    try {
      const labs = await this.elasticsearchService.search(searchObj);
      labs.body.hits.hits.forEach((lab) => {
        if (
          category !== undefined &&
          category !== null &&
          category.trim() !== ''
        ) {
          lab._source.services = lab._source.services.filter(
            (serviceFilter) => serviceFilter.info['category'] === category,
          );
        }

        lab._source.services.forEach((labService) => {
          labService.lab_detail = lab._source.info;
          labService.certifications = lab._source.certifications;
          labService.verification_status = lab._source.verification_status;
          labService.blockMetaData = lab._source.blockMetaData;
          labService.stake_amount = lab._source.stake_amount;
          labService.stake_status = lab._source.stake_status;
          labService.unstake_at = lab._source.unstake_at;
          labService.retrieve_unstake_at = lab._source.retrieve_unstake_at;
          labService.lab_id = lab._source.account_id;

          result.push(labService);
        });
      });

      return { result };
    } catch (error) {
      if (error?.body?.error?.type === 'index_not_found_exception') {
        await this.logger.log(`API "labs": ${error.body.error.reason}`);
        return { result };
      }

      throw error;
    }
  }
}
