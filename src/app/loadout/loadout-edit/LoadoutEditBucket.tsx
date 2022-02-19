import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketsSelector } from 'app/inventory/selectors';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, faTshirt } from 'app/shell/icons';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { emptyArray } from 'app/utils/empty';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import FashionDrawer from '../fashion/FashionDrawer';
import { BucketPlaceholder } from '../loadout-ui/BucketPlaceholder';
import { FashionMods } from '../loadout-ui/FashionMods';
import ItemWithFashion from '../loadout-ui/ItemWithFashion';
import LoadoutParametersDisplay from '../loadout-ui/LoadoutParametersDisplay';
import { OptimizerButton } from '../loadout-ui/OptimizerButton';
import styles from './LoadoutEditBucket.m.scss';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutEditBucket({
  category,
  storeId,
  items,
  modsByBucket,
  equippedItemIds,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
  onToggleEquipped,
  children,
}: {
  category: string;
  storeId: string;
  items?: DimItem[];
  modsByBucket: {
    [bucketHash: number]: number[];
  };
  equippedItemIds: Set<string>;
  onClickPlaceholder: (params: { bucket: InventoryBucket }) => void;
  onClickWarnItem: (item: DimItem) => void;
  onToggleEquipped: (item: DimItem) => void;
  onRemoveItem: (item: DimItem) => void;
  children?: React.ReactNode;
}) {
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : [BucketHashes.Ghost, BucketHashes.Emblems, BucketHashes.Ships, BucketHashes.Vehicle].map(
          (h) => buckets.byHash[h]
        );
  const isArmor = category === 'Armor';

  return (
    <div className={clsx(styles.itemCategory, categoryStyles[category])}>
      <div className={styles.itemsInCategory}>
        {bucketOrder.map((bucket) => (
          <ItemBucket
            key={bucket.hash}
            bucket={bucket}
            items={itemsByBucket[bucket.hash]}
            equippedItemIds={equippedItemIds}
            modsForBucket={modsByBucket[bucket.hash]}
            onClickPlaceholder={onClickPlaceholder}
            onClickWarnItem={onClickWarnItem}
            onRemoveItem={onRemoveItem}
            onToggleEquipped={onToggleEquipped}
            equippedContent={
              isArmor && (
                <FashionMods
                  modsForBucket={modsByBucket[bucket.hash] ?? emptyArray()}
                  storeId={storeId}
                />
              )
            }
          />
        ))}
      </div>
      {children}
    </div>
  );
}

export function ArmorExtras({
  loadout,
  storeId,
  subclass,
  savedMods,
  items,
  equippedItemIds,
  onModsByBucketUpdated,
}: {
  loadout: Loadout;
  storeId: string;
  subclass?: DimLoadoutItem;
  savedMods: PluggableInventoryItemDefinition[];
  items?: DimItem[];
  equippedItemIds: Set<string>;
  onModsByBucketUpdated(modsByBucket: LoadoutParameters['modsByBucket']): void;
}) {
  const defs = useD2Definitions()!;
  const equippedItems =
    items?.filter((i) => equippedItemIds.has(i.id) && i.owner !== 'unknown') ?? [];

  return (
    <>
      {equippedItems.length === 5 && (
        <div className="stat-bars destiny2">
          <LoadoutStats
            showTier
            stats={getLoadoutStats(defs, loadout.classType, subclass, equippedItems, savedMods)}
            characterClass={loadout.classType}
          />
        </div>
      )}
      {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
      <div className={styles.buttons}>
        <FashionButton
          loadout={loadout}
          items={items ?? emptyArray()}
          storeId={storeId}
          onModsByBucketUpdated={onModsByBucketUpdated}
        />
        <OptimizerButton loadout={loadout} />
      </div>
    </>
  );
}

function ItemBucket({
  bucket,
  items,
  equippedItemIds,
  equippedContent,
  modsForBucket,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
  onToggleEquipped,
}: {
  bucket: InventoryBucket;
  items: DimItem[];
  equippedItemIds: Set<string>;
  equippedContent?: React.ReactNode;
  modsForBucket: number[];
  onClickPlaceholder: (params: { bucket: InventoryBucket }) => void;
  onClickWarnItem: (item: DimItem) => void;
  onRemoveItem: (item: DimItem) => void;
  onToggleEquipped: (item: DimItem) => void;
}) {
  const bucketHash = bucket.hash;
  const [equipped, unequipped] = _.partition(items, (i) =>
    i.owner === 'unknown' ? i.equipped : equippedItemIds.has(i.id)
  );

  const showFashion = LockableBucketHashes.includes(bucketHash);

  const handlePlaceholderClick = () => onClickPlaceholder({ bucket });

  // TODO: plumb through API from context??
  // TODO: expose a menu item for adding more items?
  // TODO: add-unequipped button?
  // T0DO: customize buttons in item popup?
  // TODO: draggable items?

  return (
    <div className={clsx(styles.itemBucket, { [styles.showFashion]: showFashion })}>
      {[equipped, unequipped].map((items, index) =>
        items.length > 0 ? (
          <div
            className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
            key={index}
          >
            {items.map((item, index) => (
              <ClosableContainer
                key={item.id}
                onClose={() => onRemoveItem(item)}
                showCloseIconOnHover
              >
                <ItemWithFashion
                  item={item}
                  applyFashion={showFashion && index === 0}
                  modsForBucket={modsForBucket}
                  onMissingItemClick={() => onClickWarnItem(item)}
                  onDoubleClick={() => onToggleEquipped(item)}
                />
              </ClosableContainer>
            ))}
            {index === 0 && equippedContent}
          </div>
        ) : (
          index === 0 && (
            <div
              className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
              key={index}
            >
              <BucketPlaceholder bucketHash={bucketHash} onClick={handlePlaceholderClick} />
              {equippedContent}
            </div>
          )
        )
      )}
    </div>
  );
}

function FashionButton({
  loadout,
  items,
  storeId,
  onModsByBucketUpdated,
}: {
  loadout: Loadout;
  items: DimLoadoutItem[];
  storeId: string;
  onModsByBucketUpdated(modsByBucket: LoadoutParameters['modsByBucket']): void;
}) {
  const [showFashionDrawer, setShowFashionDrawer] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowFashionDrawer(true)}
        className="dim-button loadout-add"
      >
        <AppIcon icon={faTshirt} /> {t('Loadouts.Fashion')}
      </button>
      {showFashionDrawer &&
        ReactDOM.createPortal(
          <FashionDrawer
            loadout={loadout}
            items={items}
            storeId={storeId}
            onModsByBucketUpdated={onModsByBucketUpdated}
            onClose={() => setShowFashionDrawer(false)}
          />,
          document.body
        )}
    </>
  );
}
