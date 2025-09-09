import { PersistenceLayer } from "../../infra/persistence";
import {
  listRealEstateAssetsByUser,
  RealEstateAssetSummary,
} from "./real-estate/list-real-estate-assets.query";

export interface QueryLayer {
  real_estate: {
    listAssetsByUser(userId: string): Promise<RealEstateAssetSummary[]>;
  };
}

export function getQueryLayer({
  persistance_layer,
}: {
  persistance_layer: PersistenceLayer;
}): QueryLayer {
  return {
    real_estate: {
      listAssetsByUser: (userId: string) =>
        persistance_layer.uow.withTransaction((tx) =>
          listRealEstateAssetsByUser(tx, userId)
        ),
    },
  };
}
