import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Upload, AtSign } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface OnboardingFormProps extends Omit<HTMLMotionProps<"div">, 'onSubmit'> {
  imageSrc: string;
  avatarSrc?: string;
  avatarFallback: string;
  title: string;
  description: string;
  inputPlaceholder: string;
  buttonText: string;
  onSubmit: (username: string, avatarDataUrl?: string) => void;
  isSubmitting?: boolean;
}

const OnboardingForm = React.forwardRef<HTMLDivElement, OnboardingFormProps>(
  (
    {
      className,
      imageSrc,
      avatarSrc,
      avatarFallback,
      title,
      description,
      inputPlaceholder,
      buttonText,
      onSubmit,
      isSubmitting = false,
      ...props
    },
    ref
  ) => {
    const [username, setUsername] = React.useState("");
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit(username, selectedImage || undefined);
    };

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const FADE_UP_ANIMATION_VARIANTS = {
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { type: "spring" } },
    };

    return (
      <motion.div
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        className={`w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white shadow-xl ${className || ''}`}
        ref={ref}
        {...props}
      >
        {/* Decorative top image */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS}>
          {/* Replaced failing image with a reliable subtle gradient or solid fallback */}
          <div 
            className="h-48 w-full object-cover" 
            style={{ 
              backgroundImage: `url('${imageSrc}')`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              backgroundColor: '#f3f4f6' 
            }}
          />
        </motion.div>

        <div className="space-y-6 p-8 text-center">
          {/* Main title and description */}
          <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="space-y-2">
            <h1 className="font-bold text-2xl text-neutral-900">{title}</h1>
            <p className="text-neutral-500">{description}</p>
          </motion.div>

          {/* Avatar upload section */}
          <motion.div
            variants={FADE_UP_ANIMATION_VARIANTS}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-neutral-200">
                <AvatarImage src={selectedImage || avatarSrc} alt="User Avatar" style={{ objectFit: 'cover' }} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-sm text-neutral-900">Your avatar</p>
                <p className="text-xs text-neutral-500">PNG or JPG up to 10MB</p>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange}
            />
            
            <Button variant="outline" size="sm" onClick={handleUploadClick} type="button">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </motion.div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username input */}
            <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="relative text-left">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 z-10" />
                <Input
                  id="username"
                  placeholder={inputPlaceholder}
                  className="pl-9 bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={FADE_UP_ANIMATION_VARIANTS}>
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                {buttonText}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    );
  }
);

OnboardingForm.displayName = "OnboardingForm";

export { OnboardingForm };
