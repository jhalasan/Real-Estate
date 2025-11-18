async function handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const address = form.address.value;
    const cvFile = form.cv_file.files[0];

    if (!cvFile) {
        alert('Please upload your CV/Resume.');
        return;
    }

    const bucketName = 'applicant-cvs';
    const fileExtension = cvFile.name.split('.').pop();
    const filePath = `${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.${fileExtension}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, cvFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError.message);
            alert('CV upload failed. Please try again.');
            return;
        }

        const { error: dbError } = await supabase
            .from('recruitment_applicants')
            .insert({
                name: name,
                email: email,
                phone: phone,
                address: address,
                cv_storage_path: `${bucketName}/${filePath}`
            });

        if (dbError) {
            console.error('Database Insert Error:', dbError.message);
            alert('Application failed to save. Please contact support.');
            return;
        }

        alert('Application submitted successfully! We will contact you soon.');
        form.reset();

    } catch (error) {
        console.error('A critical error occurred:', error.message);
        alert('An unexpected error occurred during submission.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recruitform');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});