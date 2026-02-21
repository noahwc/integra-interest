interface AddCarButtonProps {
  onClick: () => void;
}

export default function AddCarButton(props: AddCarButtonProps) {
  return (
    <button
      class="card border border-base-300/60 w-full lg:w-[26rem] lg:flex-shrink-0 min-h-[160px] lg:self-stretch flex items-center justify-center hover:bg-base-100 hover:border-base-300 transition-colors cursor-pointer bg-transparent rounded-xl"
      onClick={() => props.onClick()}
    >
      <div class="text-center">
        <span class="text-4xl text-base-300">+</span>
        <p class="text-base-content/40 mt-2">Add Car</p>
      </div>
    </button>
  );
}
