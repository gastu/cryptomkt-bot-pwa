<template>
  <div>
    <!-- Modal -->
    <b-modal :active.sync="isModalVisible" :canCancel="['x']">
      <div id="buyer-card" class="card">
        <!-- Title -->
        <header class="card-header">
          <p class="card-header-title">{{ $t('buyer') }}</p>
        </header>

        <!-- Body -->
        <div class="card-content position-relative">
          <!-- Loading spinner -->
          <b-loading :active="isLoading" :is-full-page="false"></b-loading>

          <!-- Amount -->
          <label for="amount" class="label is-small">{{ $t('amount') }}</label>
          <CurrencyField
            v-model="remainingAmount"
            :id="'amount'"
            :currency="currentMarket.baseCurrency"
            :step="currentMarket.baseCurrency.step"
          />

          <!-- Fiat -->
          <label for="fiat" class="label is-small">
            {{ $t('remainingFiat') }}
          </label>
          <CurrencyField
            v-model="remainingFiat"
            :id="'amount'"
            :showMaxButton="true"
            :currency="currentMarket.quoteCurrency"
            :isMaxLoading="isMaxLoading"
            @maxButtonClicked="setMaxFiat"
          />

          <!-- Info -->
          <p class="is-size-7">{{ $t('maxPrice') }}: {{ maxPrice }}</p>
        </div>

        <!-- Action buttons -->
        <footer class="card-footer">
          <button
            id="cancel-button"
            class="card-footer-item button"
            @click="isModalVisible = false"
            :disabled="isLoading"
          >
            {{ $t('cancel') }}
          </button>
          <button
            class="card-footer-item button has-text-link"
            @click="submit"
            :disabled="isLoading"
          >
            {{ $t('update') }}
          </button>
        </footer>
      </div>
    </b-modal>
    <!-- Button -->
    <transition name="scale">
      <div
        v-show="isButtonVisible"
        id="buyer-button"
        @click="isModalVisible = true"
        class="button is-rounded has-text-weight-bold z-depth-2"
      >
        {{ $t('buyer')[0] }}
      </div>
    </transition>
  </div>
</template>

<script>
import { Component, Vue, Watch } from 'vue-property-decorator';

import CurrencyField from './CurrencyField';

@Component({
  components: { CurrencyField },
  props: ['isButtonVisible'],
})
class Buyer extends Vue {
  buyer = null;
  remainingFiat = null;
  isModalVisible = false;
  isLoading = true;
  isMaxLoading = false;

  get maxPrice() {
    if (this.buyer === null || this.remainingAmount === 0) {
      return 0;
    }
    const amount = this.remainingFiat / this.remainingAmount;
    return this.formatAmount(
      amount,
      this.currentMarket.quoteCurrency,
      this.currentMarket.decimals
    );
  }

  get remainingAmount() {
    return this.buyer ? Number(this.buyer.amount) : null;
  }

  set remainingAmount(value) {
    this.buyer.amount = value.toString();
  }

  @Watch('isModalVisible')
  onModalVisibilityChanged(isVisible) {
    if (!isVisible) {
      return;
    }
    this.isLoading = true;
    this.buyer = null;
    this.remainingFiat = null;
    this.apiService
      .getBuyer()
      .then((buyer) => {
        this.buyer = buyer;
        this.remainingFiat = this.buyer.fiat;
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  setMaxFiat() {
    this.isMaxLoading = true;
    const marketCode = this.currentMarket.quoteCurrency.code;
    this.apiService.getBalance(marketCode).then((balance) => {
      const grossBalance = Number(balance.balance);
      const netBalance = Number(balance.available);
      const remainingFiat = Number(this.buyer.fiat) + netBalance;
      // Make sure the amount isn't higher than the gross balance
      this.remainingFiat = Math.min(remainingFiat, grossBalance);
      this.isMaxLoading = false;
    });
  }

  submit() {
    this.isLoading = true;
    this.buyer.fiat = this.remainingFiat.toString();
    this.apiService
      .patchBuyer(this.buyer)
      .then(() => {
        this.isModalVisible = false;
        this.isLoading = false;
      })
      .catch(() => {
        this.$buefy.snackbar.open({
          message: this.$t('errorMsg'),
          type: 'is-danger',
          indefinite: true,
        });
        this.isLoading = false;
      });
  }
}

export default Buyer;
</script>

<style scoped lang="scss">
$green: #4caf50;

#buyer-card {
  border-top: 6px solid $green;
  border-radius: 4px;
}
#buyer-button {
  background-color: $green;
  color: #fff;
  border: none;
  width: 48px;
  height: 48px;
  position: fixed;
  bottom: 3%;
  right: 4%;
  z-index: 30;
}
.card-footer-item {
  height: 100%;
  border: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
#cancel-button {
  border-bottom-right-radius: 0;
}
</style>
